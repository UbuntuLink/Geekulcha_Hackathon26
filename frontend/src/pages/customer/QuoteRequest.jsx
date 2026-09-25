import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import { setPreferredProvider, estimatePrice, getServiceRequest } from "../../api/services.js";
import { formatRange } from "../../lib/format.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

/**
 * "Request a quote" now just flags this provider as preferred on the request (they get
 * highlighted in their own Requests Feed) — it no longer creates a Quote itself. The provider
 * submits the real Quote from RequestDetail.jsx after reviewing the job. See PROJECT.md §5.
 */
export default function QuoteRequest() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const provider = state?.provider;
  const mainService = provider?.services?.[0];

  const [expectedRange, setExpectedRange] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mainService) return;
    setLoadingPrice(true);
    getServiceRequest(id)
      .then((req) => estimatePrice(mainService.serviceName.toLowerCase(), req.description))
      .then((price) => setExpectedRange(price))
      .catch(() => setExpectedRange(null))
      .finally(() => setLoadingPrice(false));
  }, [id, mainService]);

  if (!provider) {
    return (
      <Screen title={t("customer.requestQuote")}>
        <p className="text-sm text-gray-500">{t("common.startFromProblem")}</p>
      </Screen>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await setPreferredProvider(id, provider.providerProfileId);
      navigate(`/requests/${id}/quotes`);
    } catch (err) {
      setError("Couldn't send the quote request — is the backend running?");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title={t("customer.requestQuote")} subtitle={t("customer.quoteRequestSubtitle")}>
      <Card>
        <p className="text-sm font-medium text-gray-500">{t("customer.providerTitle")}</p>
        <p className="font-semibold text-gray-900">{provider.providerName}</p>
        <p className="mt-2 text-sm font-medium text-gray-500">{t("customer.serviceTitle")}</p>
        <p className="font-semibold text-gray-900">{mainService?.serviceName ?? t("common.service")}</p>
      </Card>

      {loadingPrice && (
        <div className="mt-4">
          <Loading label=" Asking AI for a fair price estimate..." />
        </div>
      )}
      {expectedRange?.estimated_min_zar != null && (
        <p className="mt-4 font-medium text-brand">
          {t("customer.expectedPrice")}: {formatRange(expectedRange.estimated_min_zar, expectedRange.estimated_max_zar)}
        </p>
      )}

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      <Button onClick={handleSubmit} disabled={submitting} className="mt-6">
        {submitting ? t("customer.sending") : t("customer.sendQuoteRequest")}
      </Button>
      <p className="mt-2 text-center text-xs text-gray-500">
        {t("customer.quoteInfo")} {provider.providerName.split(" ")[0]} {t("customer.quoteInfoTail")}
      </p>
    </Screen>
  );
}
