import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { getMyServiceRequests } from "../../api/services.js";

function requestRoute(req) {
  const bookingId = req.bookingId ?? req.booking?.id ?? null;
  if (bookingId) return `/bookings/${bookingId}`;
  return req.status === "OPEN" ? `/requests/${req.id}/matches` : `/requests/${req.id}/quotes`;
}

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    getMyServiceRequests().then(setRequests).catch(() => setRequests([]));
  }, []);

  return (
    <Screen title="Your requests" showBack={false} withNav>
      {requests.length === 0 && <EmptyState>No requests yet.</EmptyState>}
      {requests.map((req) => (
        <Card
          key={req.id}
          className="mb-2 cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => navigate(requestRoute(req))}
        >
          <p className="font-medium text-gray-900">{req.description}</p>
          <p className="text-sm capitalize text-gray-500">{req.status?.toLowerCase().replace("_", " ")}</p>
        </Card>
      ))}
    </Screen>
  );
}
