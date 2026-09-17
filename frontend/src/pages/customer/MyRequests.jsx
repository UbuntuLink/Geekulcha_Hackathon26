import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/common/Card.jsx";
import BottomNav from "../../components/layout/BottomNav.jsx";
import { getMyServiceRequests } from "../../api/services.js";

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    getMyServiceRequests().then(setRequests).catch(() => setRequests([]));
  }, []);

  return (
    <div className="min-h-screen bg-cream px-4 pb-24 pt-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Your requests</h1>
      {requests.length === 0 && <p className="text-sm text-gray-500">No requests yet.</p>}
      {requests.map((req) => (
        <Card
          key={req.id}
          className="mb-2 cursor-pointer"
          onClick={() => navigate(`/requests/${req.id}/matches`)}
        >
          <p className="font-medium text-gray-900">{req.description}</p>
          <p className="text-sm text-gray-500 capitalize">{req.status?.toLowerCase().replace("_", " ")}</p>
        </Card>
      ))}
      <BottomNav />
    </div>
  );
}
