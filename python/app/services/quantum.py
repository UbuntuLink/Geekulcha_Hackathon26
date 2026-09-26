from app.schemas.quantum import QuantumOptimisationRequest

# numpy/scipy/qiskit are imported inside optimise_quantum, not here: main.py loads this module at
# startup, so a missing or broken quantum install would otherwise take classification and pricing
# down with it instead of failing only /quantum/optimise.


def _normalise_lower_is_better(values: list[float]) -> list[float]:
    """
    Converts values to the range 0 -> 1.

    Lowest value becomes 0.
    Highest value becomes 1.

    Useful for things such as:
        distance
        price
    """

    minimum = min(values)
    maximum = max(values)

    if minimum == maximum:
        return [0.0 for _ in values]

    return [
        (value - minimum) / (maximum - minimum)
        for value in values
    ]


def _normalise_higher_is_better(values: list[float]) -> list[float]:
    """
    Converts values into a COST.

    Highest value becomes 0.
    Lowest value becomes 1.

    Useful for rating because:
        high rating = good = low cost
    """

    minimum = min(values)
    maximum = max(values)

    if minimum == maximum:
        return [0.0 for _ in values]

    return [
        (maximum - value) / (maximum - minimum)
        for value in values
    ]


def optimise_quantum(request: QuantumOptimisationRequest):

    # ---------------------------------------------------------
    # VERSION 1:
    # One job -> many possible providers
    # ---------------------------------------------------------

    if len(request.jobs) != 1:
        raise ValueError(
            "Quantum optimiser currently supports exactly one job."
        )

    job = request.jobs[0]

    # We don't want QAOA considering unavailable providers.
    providers = [
        provider
        for provider in request.providers
        if provider.available
    ]

    if len(providers) == 0:
        raise ValueError("No available providers were supplied.")

    # If there is only one possible provider,
    # there is nothing to optimise.
    if len(providers) == 1:
        return {
            "assignments": [
                {
                    "jobId": job.jobId,
                    "providerId": providers[0].providerId
                }
            ],
            "algorithm": "DIRECT"
        }

    import numpy as np

    from scipy.optimize import minimize

    from qiskit.circuit.library import qaoa_ansatz
    from qiskit.primitives import StatevectorEstimator, StatevectorSampler

    from qiskit_addon_opt_mapper import OptimizationProblem
    from qiskit_addon_opt_mapper.converters import OptimizationProblemToQubo
    from qiskit_addon_opt_mapper.translators import to_ising

    # ---------------------------------------------------------
    # 1. NORMALISE PROVIDER INFORMATION
    # ---------------------------------------------------------

    distances = [provider.distanceKm for provider in providers]
    prices = [provider.estimatedPrice for provider in providers]
    ratings = [provider.rating for provider in providers]

    distance_costs = _normalise_lower_is_better(distances)
    price_costs = _normalise_lower_is_better(prices)
    rating_costs = _normalise_higher_is_better(ratings)

    # ---------------------------------------------------------
    # 2. DETERMINE WEIGHTS
    # ---------------------------------------------------------
    #
    # Higher urgency means distance becomes more important.
    #
    # urgency 0:
    #   distance = 35%
    #   price    = 35%
    #   rating   = 30%
    #
    # urgency 1:
    #   distance = 55%
    #   price    = 20%
    #   rating   = 25%
    # ---------------------------------------------------------

    urgency = max(0.0, min(1.0, job.urgency))

    distance_weight = 0.35 + (0.20 * urgency)
    price_weight = 0.35 - (0.15 * urgency)

    rating_weight = (
        1.0
        - distance_weight
        - price_weight
    )

    # ---------------------------------------------------------
    # 3. CALCULATE COST OF EACH PROVIDER
    # ---------------------------------------------------------
    #
    # LOWER COST = BETTER PROVIDER
    # ---------------------------------------------------------

    provider_costs = []

    for i in range(len(providers)):

        cost = (
            distance_weight * distance_costs[i]
            + price_weight * price_costs[i]
            + rating_weight * rating_costs[i]
        )

        provider_costs.append(cost)

    print("\n---------- QUANTUM OPTIMISATION ----------")

    for i, provider in enumerate(providers):
        print(
            f"Provider {provider.providerId}: "
            f"cost={provider_costs[i]:.4f}"
        )

    # ---------------------------------------------------------
    # 4. CREATE THE OPTIMISATION PROBLEM
    # ---------------------------------------------------------
    #
    # Each provider becomes a binary variable.
    #
    # provider_0 = 0 or 1
    # provider_1 = 0 or 1
    # provider_2 = 0 or 1
    #
    # 1 = provider selected
    # ---------------------------------------------------------

    problem = OptimizationProblem(
        "UbuntuLink Provider Matching"
    )

    for i in range(len(providers)):
        problem.binary_var(
            name=f"provider_{i}"
        )

    # ---------------------------------------------------------
    # Objective:
    #
    # minimise
    #
    # cost0*x0 + cost1*x1 + cost2*x2 ...
    # ---------------------------------------------------------

    linear_objective = {
        f"provider_{i}": provider_costs[i]
        for i in range(len(providers))
    }

    problem.minimize(
        linear=linear_objective
    )

    # ---------------------------------------------------------
    # Constraint:
    #
    # EXACTLY ONE provider must be selected.
    #
    # x0 + x1 + x2 + ... = 1
    # ---------------------------------------------------------

    selection_constraint = {
        f"provider_{i}": 1
        for i in range(len(providers))
    }

    problem.linear_constraint(
        linear=selection_constraint,
        sense="==",
        rhs=1,
        name="select_exactly_one_provider"
    )

    print("\nOriginal optimisation problem:")
    print(problem.prettyprint())

    # ---------------------------------------------------------
    # 5. CONVERT TO QUBO
    # ---------------------------------------------------------
    #
    # Quantum algorithms work nicely with:
    #
    # QUBO
    # Quadratic Unconstrained Binary Optimisation
    #
    # The converter turns our constraint into a penalty.
    # ---------------------------------------------------------

    converter = OptimizationProblemToQubo(
        penalty=5.0
    )

    qubo = converter.convert(problem)

    print("\nQUBO:")
    print(qubo.prettyprint())

    # ---------------------------------------------------------
    # 6. CONVERT QUBO -> ISING HAMILTONIAN
    # ---------------------------------------------------------
    #
    # This is where our normal optimisation problem becomes
    # something a quantum circuit can work with.
    # ---------------------------------------------------------

    cost_hamiltonian, offset = to_ising(qubo)

    print("\nHamiltonian:")
    print(cost_hamiltonian)

    print("Offset:", offset)

    # ---------------------------------------------------------
    # 7. BUILD QAOA QUANTUM CIRCUIT
    # ---------------------------------------------------------

    reps = 1

    circuit = qaoa_ansatz(
        cost_hamiltonian,
        reps=reps
    )

    # ---------------------------------------------------------
    # 8. OPTIMISE QAOA PARAMETERS
    # ---------------------------------------------------------
    #
    # QAOA is hybrid:
    #
    # Quantum:
    #     evaluates the cost Hamiltonian
    #
    # Classical:
    #     COBYLA adjusts beta/gamma
    # ---------------------------------------------------------

    estimator = StatevectorEstimator()

    def quantum_cost(parameters):

        result = estimator.run(
            [
                (
                    circuit,
                    cost_hamiltonian,
                    parameters
                )
            ]
        ).result()

        energy = result[0].data.evs.item()

        return float(np.real(energy))

    rng = np.random.default_rng(42)

    initial_parameters = rng.uniform(
        0,
        np.pi,
        circuit.num_parameters
    )

    optimisation_result = minimize(
        quantum_cost,
        initial_parameters,
        method="COBYLA",
        options={
            "maxiter": 100,
            "rhobeg": 0.5
        }
    )

    print("\nQAOA optimisation complete.")
    print(
        "Energy:",
        optimisation_result.fun
    )

    print(
        "Parameters:",
        optimisation_result.x
    )

    # ---------------------------------------------------------
    # 9. RUN FINAL QUANTUM CIRCUIT
    # ---------------------------------------------------------

    final_circuit = circuit.assign_parameters(
        optimisation_result.x
    )

    final_circuit.measure_all()

    sampler = StatevectorSampler(
        seed=42
    )

    sample_result = sampler.run(
        [final_circuit],
        shots=2048
    ).result()

    counts = (
        sample_result[0]
        .data
        .meas
        .get_counts()
    )

    print("\nQuantum measurement counts:")
    print(counts)

    # ---------------------------------------------------------
    # 10. FIND MOST LIKELY VALID QUANTUM RESULT
    # ---------------------------------------------------------

    valid_results = []

    for bitstring, count in counts.items():

        # Qiskit displays qubits in reverse order.
        #
        # "001"
        #
        # means:
        #
        # provider_0 = 1
        # provider_1 = 0
        # provider_2 = 0

        bits = [
            int(bit)
            for bit in bitstring[::-1]
        ]

        # Exactly one provider must be selected.
        if sum(bits) != 1:
            continue

        provider_index = bits.index(1)

        if provider_index >= len(providers):
            continue

        valid_results.append(
            (
                provider_index,
                count
            )
        )

    if not valid_results:
        raise RuntimeError(
            "QAOA did not produce a valid provider assignment."
        )

    # Pick the valid quantum result measured most often.
    selected_provider_index, selected_count = max(
        valid_results,
        key=lambda result: (
            result[1],
            -provider_costs[result[0]]
        )
    )

    selected_provider = providers[
        selected_provider_index
    ]

    print(
        "\nSelected Provider:",
        selected_provider.providerId
    )

    print(
        "Measurement count:",
        selected_count
    )

    print("------------------------------------------\n")

    return {
        "assignments": [
            {
                "jobId": job.jobId,
                "providerId": selected_provider.providerId
            }
        ],
        "algorithm": "QAOA"
    }