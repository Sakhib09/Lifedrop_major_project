import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import MLPrediction from "./MLPrediction";
import DonorMap from "./DonorMap";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  Droplet,
  Heart,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import Auth from "./Auth";
import api from "./api";
import "./App.css";

const STORAGE = {
  token: "lifedrop_token",
  user: "lifedrop_user",
  expiry: "lifedrop_token_expiry",
  type: "lifedrop_token_type",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const CITIES = ["Bengaluru", "Mangaluru", "Mysuru", "Udupi", "Moodbidri"];

// Real institution names for the form's demo selection list. These are not verified LifeDrop partners.
const HOSPITALS_BY_CITY = {
  Bengaluru: [
    "Victoria Hospital",
    "Bowring and Lady Curzon Hospital",
    "St. John's Medical College Hospital",
  ],
  Mangaluru: [
    "Wenlock District Hospital",
    "A.J. Hospital and Research Centre",
    "Father Muller Medical College Hospital",
  ],
  Mysuru: ["K.R. Hospital", "JSS Hospital", "Apollo BGS Hospitals"],
  Udupi: ["District Hospital Udupi", "Dr. TMA Pai Hospital", "Adarsha Hospital"],
  Moodbidri: ["Alva's Health Centre"],
};

const FEATURES = [
  {
    id: "donors",
    title: "Find donors",
    description: "Search available donors by blood group and location.",
    icon: Search,
  },
  {
    id: "requests",
    title: "Blood requests",
    description: "Create and manage requests for blood donations.",
    icon: ClipboardList,
  },
  {
    id: "responses",
    title: "My responses",
    description: "Review donor responses to your requests.",
    icon: Activity,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Stay informed about request activity.",
    icon: Bell,
  },
];

function clearSession() {
  Object.values(STORAGE).forEach((key) => localStorage.removeItem(key));
}

function getSession() {
  try {
    const token = localStorage.getItem(STORAGE.token);
    const user = localStorage.getItem(STORAGE.user);
    const expiry = Number(localStorage.getItem(STORAGE.expiry) || 0);

    if (!token || !user) return null;

    if (expiry && Date.now() >= expiry) {
      clearSession();
      return null;
    }

    return { token, user: JSON.parse(user) };
  } catch {
    clearSession();
    return null;
  }
}

function getError(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }
  if (error?.response) {
    return `Request failed with status ${error.response.status}.`;
  }
  if (error?.request) {
    return "Cannot connect to the backend. Check that FastAPI is running.";
  }

  return error?.message || "Something went wrong.";
}

function getArray(data, preferredKeys = []) {
  if (Array.isArray(data)) return data;

  for (const key of [
    ...preferredKeys,
    "items",
    "results",
    "requests",
    "donors",
    "notifications",
  ]) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} type="button">
      <Droplet size={21} fill="currentColor" strokeWidth={1.5} />
      <span>lifedrop</span>
    </button>
  );
}

function Eyebrow({ children }) {
  return (
    <div className="eyebrow">
      <span className="eyebrow-dot" />
      {children}
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <span className="footer-brand">lifedrop.</span>
      <span>Designed around the value of every life.</span>
      <span>Academic project · Demonstration platform</span>
    </footer>
  );
}

function Reveal({ children, delay = 0, className = "" }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function BloodArtwork() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="hero-art" aria-label="LifeDrop blood-drop illustration">
      <motion.div
        className="orbit orbit-one"
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="orbit orbit-two"
        animate={reducedMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="blood-sculpture"
        animate={reducedMotion ? undefined : { y: [0, -22, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="sculpture-shine" />
        {[1, 2, 3, 4, 5].map((number) => (
          <div
            key={number}
            className={`sculpture-band band-${[
              "one",
              "two",
              "three",
              "four",
              "five",
            ][number - 1]}`}
          />
        ))}
        <div className="sculpture-center">
          <Droplet size={29} strokeWidth={1.2} />
        </div>
      </motion.div>

      <span className="art-caption">GIVE WITH PURPOSE</span>

      <div className="art-note">
        <span className="eyebrow-dot" />
        A little care can mean everything.
      </div>
    </div>
  );
}

function LandingPage({ onEnter }) {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="nav-inner">
          <Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />

          <nav className="nav-links">
            <a href="#mission">Our mission</a>
            <a href="#how">How it works</a>
            <a href="#network">The network</a>
            <button className="nav-cta" onClick={onEnter} type="button">
              Enter LifeDrop <ArrowRight size={15} />
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <Eyebrow>A NETWORK BUILT AROUND LIFE</Eyebrow>

            <h1>
              When it
              <br />
              matters
              <br />
              <em>most.</em>
            </h1>

            <p>
              Bringing blood donors and people in need closer together.
              Because the right connection can make all the difference.
            </p>

            <div className="hero-actions">
              <button className="primary-button" onClick={onEnter} type="button">
                Explore LifeDrop <ArrowRight size={16} />
              </button>
              <a className="text-link" href="#mission">
                Discover our mission
              </a>
            </div>

            <a className="scroll-link" href="#mission">
              SCROLL TO EXPLORE <ArrowDown size={14} />
            </a>
          </div>

          <BloodArtwork />

          <div className="vertical-note">
            ONE COMMUNITY
            <br />
            CONNECTED THROUGH LIFE
          </div>
        </section>

        <section className="mission-section" id="mission">
          <Reveal className="mission-heading">
            <Eyebrow>01 / THE REASON WE EXIST</Eyebrow>
            <h2>
              A small act.
              <br />
              <em>An extraordinary</em>
              <br />
              difference.
            </h2>
          </Reveal>

          <Reveal className="mission-copy" delay={0.15}>
            <Heart size={23} strokeWidth={1.4} />
            <span className="small-label">LIFE, CONNECTED.</span>
            <h3>Every connection matters.</h3>
            <p>
              LifeDrop helps people discover donors, coordinate blood requests,
              and follow updates through one organised platform.
            </p>
            <button className="underlined-link" onClick={onEnter} type="button">
              Explore the platform <ArrowRight size={15} />
            </button>
          </Reveal>
        </section>

        <section className="how-section" id="how">
          <div className="section-heading">
            <div>
              <Eyebrow>02 / SIMPLE BY DESIGN</Eyebrow>
              <h2>
                Connection changes
                <br />
                everything.
              </h2>
            </div>
            <p>A clearer way to coordinate blood donation activity.</p>
          </div>

          <div className="process-grid">
            {FEATURES.filter((feature) => feature.id !== "responses").map(
              (feature, index) => {
                const Icon = feature.icon;

                return (
                  <Reveal
                    className="process-card"
                    delay={index * 0.12}
                    key={feature.id}
                  >
                    <div className="process-top">
                      <span>0{index + 1}</span>
                      <Icon size={19} strokeWidth={1.4} />
                    </div>
                    <div className="process-rule" />
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <button
                      onClick={onEnter}
                      aria-label={feature.title}
                      type="button"
                    >
                      <ArrowRight size={17} />
                    </button>
                  </Reveal>
                );
              },
            )}
          </div>
        </section>

        <section className="network-banner" id="network">
          <div className="banner-icon">
            <Droplet size={27} fill="currentColor" />
          </div>
          <div className="banner-copy">
            <Eyebrow>THE LIFEDROP NETWORK</Eyebrow>
            <h2>Every connection starts somewhere.</h2>
            <p>Discover a more organised way to coordinate blood donation.</p>
          </div>
          <button className="banner-button" onClick={onEnter} type="button">
            Enter the platform <ArrowRight size={16} />
          </button>
        </section>

        <div className="disclaimer">
          <ShieldCheck size={16} />
          <span>
            LifeDrop is an academic demonstration platform. It does not
            establish medical eligibility or replace professional medical advice.
          </span>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Dashboard({ user, onOpen }) {
  return (
    <main className="workspace-main">
      <section className="workspace-heading">
        <Eyebrow>YOUR DONATION WORKSPACE</Eyebrow>

        <h1>
          Better connections.
          <br />
          <em>One community.</em>
        </h1>

        <p>
          Welcome, {user?.full_name || "there"}. What would you like to do
          today?
        </p>
      </section>

      <section className="workspace-grid">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.button
              className="workspace-card"
              key={feature.id}
              onClick={() => onOpen(feature.id)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.4 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.99 }}
              type="button"
            >
              <div className="workspace-card-top">
                <Icon size={21} strokeWidth={1.4} />
                <ArrowRight size={16} />
              </div>

              <h2>{feature.title}</h2>
              <p>{feature.description}</p>

              <span className="card-link">OPEN WORKSPACE</span>
            </motion.button>
          );
        })}
      </section>

      <div className="workspace-note">
        <Users size={18} />
        Designed to support responsible donor coordination.
      </div>

      <div className="disclaimer">
        <ShieldCheck size={16} />
        <span>
          Donor matching is preliminary and does not establish medical
          eligibility.
        </span>
      </div>

      {/* SVM machine learning screening demonstration */}
      <MLPrediction />

<DonorMap />

    </main>
  );
}
function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <RefreshCw className="spin" size={22} />
      <p>Loading information...</p>
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <Droplet size={25} />
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

function Notice({ message, type = "error" }) {
  if (!message) return null;

  return (
    <div className={type === "success" ? "success-message" : "error-message"} role="status">
      {message}
    </div>
  );
}

function DonorSearch({ refreshKey }) {
  const [bloodGroup, setBloodGroup] = useState("");
  const [city, setCity] = useState("");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
const [locationMessage, setLocationMessage] = useState("");

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    setLocationMessage("GPS location is not supported by your browser.");
    return;
  }

  setLocationMessage("Getting your location...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setUserLocation(location);
      setLocationMessage("Your location was detected successfully!");
      console.log("Current GPS location:", location);
    },
    (error) => {
      setLocationMessage(
        error.code === 1
          ? "Location permission denied. Please allow location access."
          : "Unable to get your location. Please try again."
      );
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};
  const search = useCallback(async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = {};
      if (bloodGroup) params.blood_group = bloodGroup;
      if (city.trim()) params.city = city.trim();

      const response = await api.get("/donors/search", { params });
      setDonors(getArray(response.data, ["donors"]));
    } catch (err) {
      setDonors([]);
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, [bloodGroup, city]);

  useEffect(() => {
    if (refreshKey > 0) search();
  }, [refreshKey, search]);

  return (
    <>
     <div className="search-layout search-layout-no-location">
  {/* LEFT: Search filters */}
  <form className="search-form" onSubmit={search}>
    <label>
      Blood group
      <select
        value={bloodGroup}
        onChange={(event) => setBloodGroup(event.target.value)}
      >
        <option value="">All groups</option>
        {BLOOD_GROUPS.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </select>
    </label>

    <label>
      City
      <select
        value={city}
        onChange={(event) => setCity(event.target.value)}
      >
        <option value="">All Cities</option>
        <option value="Bengaluru">Bengaluru</option>
        <option value="Mangaluru">Mangaluru</option>
        <option value="Mysuru">Mysuru</option>
        <option value="Udupi">Udupi</option>
        <option value="Moodbidri">Moodbidri</option>
      </select>
    </label>

    <button
      className="primary-button search-submit"
      type="submit"
      disabled={loading}
    >
      <Search size={16} />
      {loading ? "Searching..." : "Search donors"}
    </button>
  </form>

  {/* RIGHT: Current location */}

</div>

      <Notice message={error} />

      {loading ? (
        <LoadingState />
      ) : donors.length ? (
        <div className="records-list">
          {donors.map((donor) => (
            <article className="record-card" key={donor.donor_id}>
              <div className="record-icon"><Droplet size={19} /></div>
              <div className="record-content">
                <h3>{donor.full_name || "Registered Donor"}</h3>
<p className="donor-blood-group">Blood group: {donor.blood_group}</p>
{donor.phone && (
  <p className="donor-phone">
    📞 Phone: {donor.phone}
  </p>
)}
                <p>
                  <MapPin size={14} />
                  {[donor.city, donor.state].filter(Boolean).join(", ")}
                </p>
                <span className="status-label">
                  {donor.is_available ? "Available" : "Unavailable"}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={searched ? "No donors found" : "Find a donor"}
          message={
            searched
              ? "Try another blood group or city."
              : "Choose a blood group or city, then search available donors."
          }
        />
      )}
    </>
  );
}

function BloodRequestForm({ onCreated }) {
  const [form, setForm] = useState({
    blood_group: "O+",
    units_required: "1",
    hospital_name: "",
    city: "Bengaluru",
    state: "Karnataka",
    urgency: "normal",
    required_by: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        units_required: Number(form.units_required),
        hospital_name: form.hospital_name.trim() || null,
        city: form.city.trim(),
        state: form.state.trim() || null,
        required_by: form.required_by || null,
      };

      const response = await api.post("/blood-requests/", payload);

      setSuccess(`Blood request #${response.data.request_id} created.`);
      setForm({
        blood_group: "O+",
        units_required: "1",
        hospital_name: "",
        city: "Bengaluru",
        state: "Karnataka",
        urgency: "normal",
        required_by: "",
      });

      onCreated();
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="request-form-panel">
      <h2>Create a blood request</h2>
      <p>Provide the required details to publish a request.</p>

      <form className="search-form request-form" onSubmit={submit}>
        <label>
          Blood group *
          <select name="blood_group" value={form.blood_group} onChange={update}>
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </label>

        <label>
          Units required *
          <input
            type="number"
            name="units_required"
            min="1"
            max="100"
            value={form.units_required}
            onChange={update}
            required
          />
        </label>

        <label>
          City *
          <select
            name="city"
            value={form.city}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                city: event.target.value,
                hospital_name: "",
                state: "Karnataka",
              }))
            }
            required
          >
            <option value="">Select a city</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label>
          Hospital name *
          <select
            name="hospital_name"
            value={form.hospital_name}
            onChange={update}
            required
          >
            <option value="">Select a hospital</option>
            {(HOSPITALS_BY_CITY[form.city] || []).map((hospital) => (
              <option key={hospital} value={hospital}>
                {hospital}
              </option>
            ))}
          </select>
        </label>

        <label>
          State
          <input name="state" value="Karnataka" readOnly />
        </label>

        <label>
          Urgency
          <select name="urgency" value={form.urgency} onChange={update}>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </label>

        <label>
          Required by
          <input
            type="date"
            name="required_by"
            value={form.required_by}
            onChange={update}
            min={new Date().toISOString().slice(0, 10)}
          />
        </label>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create request"}
          <ArrowRight size={16} />
        </button>
      </form>

      <Notice message={error} />
      <Notice message={success} type="success" />
    </section>
  );
}

function BloodRequests({ user, refreshKey }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/blood-requests/");
      setRequests(getArray(response.data, ["requests"]));
    } catch (err) {
      setError(getError(err));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function respond(request) {
    setBusyId(request.request_id);
    setError("");
    setMessage("");

    try {
      await api.post(`/blood-requests/${request.request_id}/responses`);
      setMessage(`Your interest in request #${request.request_id} was recorded.`);
      await load();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(request, status) {
    setBusyId(request.request_id);
    setError("");
    setMessage("");

    try {
      await api.patch(
        `/blood-requests/${request.request_id}/status`,
        null,
        { params: { status } },
      );

      setMessage(`Request #${request.request_id} marked ${status}.`);
      await load();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <BloodRequestForm onCreated={load} />
      <Notice message={error} />
      <Notice message={message} type="success" />

      <div className="subsection-heading">
        <h2>Blood requests</h2>
        <span>{requests.length} records</span>
      </div>

      {loading ? (
        <LoadingState />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No blood requests yet"
          message="Create a request using the form above."
        />
      ) : (
        <div className="records-list">
          {requests.map((request) => {
            const isOwner = Number(request.requester_id) === Number(user?.user_id);
            const busy = busyId === request.request_id;

            return (
              <article className="record-card record-card-expanded" key={request.request_id}>
                <div className="record-icon"><ClipboardList size={19} /></div>

                <div className="record-content">
                  <h3>
                    {request.blood_group} · {request.units_required} unit(s)
                  </h3>
                  <p>
                    Request #{request.request_id}
                    {request.hospital_name ? ` · ${request.hospital_name}` : ""}
                  </p>
                  <p>
                    <MapPin size={14} />
                    {[request.city, request.state].filter(Boolean).join(", ")}
                  </p>
                  <p>
                    Urgency: {request.urgency} · Status: {request.status}
                  </p>
                  {request.required_by && (
                    <p>Required by: {String(request.required_by).slice(0, 10)}</p>
                  )}

                  {request.status === "open" && (
                    <div className="record-actions">
                      {!isOwner && (
                        <button
                          className="primary-button"
                          onClick={() => respond(request)}
                          disabled={busy}
                          type="button"
                        >
                          {busy ? "Processing..." : "Respond"}
                        </button>
                      )}

                      {isOwner && (
                        <>
                          <button
                            className="secondary-button"
                            onClick={() => changeStatus(request, "fulfilled")}
                            disabled={busy}
                            type="button"
                          >
                            <CheckCircle2 size={15} /> Fulfilled
                          </button>
                          <button
                            className="secondary-button"
                            onClick={() => changeStatus(request, "cancelled")}
                            disabled={busy}
                            type="button"
                          >
                            <XCircle size={15} /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function MyResponses({ user, refreshKey }) {
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseLoading, setResponseLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/blood-requests/");
      const ownRequests = getArray(response.data, ["requests"]).filter(
        (request) =>
          Number(request.requester_id) === Number(user?.user_id),
      );

      setRequests(ownRequests);
      setSelectedId((current) => {
        if (current && ownRequests.some((item) => String(item.request_id) === current)) {
          return current;
        }
        return ownRequests.length ? String(ownRequests[0].request_id) : "";
      });
    } catch (err) {
      setError(getError(err));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  const loadResponses = useCallback(async () => {
    if (!selectedId) {
      setResponses([]);
      return;
    }

    setResponseLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/blood-requests/${selectedId}/responses`,
      );
      setResponses(getArray(response.data, ["responses"]));
    } catch (err) {
      setError(getError(err));
      setResponses([]);
    } finally {
      setResponseLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests, refreshKey]);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  async function updateResponse(responseId, status) {
    setBusyId(responseId);
    setError("");
    setMessage("");

    try {
      await api.patch(
        `/blood-requests/${selectedId}/responses/${responseId}`,
        null,
        { params: { status } },
      );

      setMessage(`Donor response ${status}.`);
      await loadResponses();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <Notice message={error} />
      <Notice message={message} type="success" />

      {requests.length === 0 ? (
        <EmptyState
          title="No requests created by you"
          message="Create a blood request first. Donor responses will appear here."
        />
      ) : (
        <>
          <label className="response-request-select">
            Select your blood request
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {requests.map((request) => (
                <option key={request.request_id} value={request.request_id}>
                  #{request.request_id} · {request.blood_group} · {request.city}
                </option>
              ))}
            </select>
          </label>

          <div className="subsection-heading">
            <h2>Donor responses</h2>
            <span>{responses.length} responses</span>
          </div>

          {responseLoading ? (
            <LoadingState />
          ) : responses.length === 0 ? (
            <EmptyState
              title="No responses yet"
              message="Donor responses to this request will appear here."
            />
          ) : (
            <div className="records-list">
              {responses.map((response) => {
                const busy = busyId === response.response_id;

                return (
                  <article className="record-card record-card-expanded" key={response.response_id}>
                    <div className="record-icon"><Users size={19} /></div>

                    <div className="record-content">
                      <h3>{response.full_name || "Donor"}</h3>
                      <p>
                        {response.blood_group} ·{" "}
                        {[response.city, response.state].filter(Boolean).join(", ")}
                      </p>
                      <p>Status: {response.response_status}</p>

                      {response.response_status === "interested" && (
                        <div className="record-actions">
                          <button
                            className="primary-button"
                            disabled={busy}
                            onClick={() => updateResponse(response.response_id, "accepted")}
                            type="button"
                          >
                            <CheckCircle2 size={15} /> Accept
                          </button>
                          <button
                            className="secondary-button"
                            disabled={busy}
                            onClick={() => updateResponse(response.response_id, "declined")}
                            type="button"
                          >
                            <XCircle size={15} /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

function Notifications({ refreshKey }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/notifications/");
      setNotifications(getArray(response.data, ["notifications"]));
    } catch (err) {
      setError(getError(err));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function markRead(notification) {
    setBusyId(notification.notification_id);
    setError("");
    setMessage("");

    try {
      await api.patch(`/notifications/${notification.notification_id}/read`);
      setNotifications((previous) =>
        previous.map((item) =>
          item.notification_id === notification.notification_id
            ? { ...item, is_read: true }
            : item,
        ),
      );
      setMessage("Notification marked as read.");
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <Notice message={error} />
      <Notice message={message} type="success" />

      {notifications.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          message="New request activity and updates will appear here."
        />
      ) : (
        <div className="records-list">
          {notifications.map((notification) => (
            <article className="record-card" key={notification.notification_id}>
              <div className="record-icon"><Bell size={19} /></div>
              <div className="record-content">
                <h3>{notification.message}</h3>
                <p>
                  {notification.created_at
                    ? new Date(notification.created_at).toLocaleString("en-IN")
                    : "Notification"}
                </p>
                <p>Status: {notification.is_read ? "Read" : "Unread"}</p>

                {!notification.is_read && (
                  <div className="record-actions">
                    <button
                      className="secondary-button"
                      disabled={busyId === notification.notification_id}
                      onClick={() => markRead(notification)}
                      type="button"
                    >
                      <CheckCircle2 size={15} /> Mark as read
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function FeaturePage({ feature, user, onBack }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const info = FEATURES.find((item) => item.id === feature);
  const Icon = info?.icon || Activity;

  return (
    <motion.main
      className="feature-main"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <button className="back-link" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Back to workspace
      </button>

      <div className="feature-heading">
        <div className="feature-heading-icon"><Icon size={23} /></div>
        <div>
          <Eyebrow>LIFEDROP WORKSPACE</Eyebrow>
          <h1>{info?.title || "Workspace"}</h1>
          <p>{info?.description}</p>
        </div>
        <button
          className="refresh-button"
          onClick={() => setRefreshKey((value) => value + 1)}
          type="button"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {feature === "donors" && (
  <DonorSearch refreshKey={refreshKey} />
)}
      {feature === "requests" && (
        <BloodRequests user={user} refreshKey={refreshKey} />
      )}
      {feature === "responses" && (
        <MyResponses user={user} refreshKey={refreshKey} />
      )}
      {feature === "notifications" && (
        <Notifications refreshKey={refreshKey} />
      )}
    </motion.main>
  );
}

function Workspace({ user, onLogout, onHome }) {
  const [feature, setFeature] = useState(null);

  return (
    <div className="workspace-page">
      <header className="workspace-nav">
        <div className="workspace-nav-inner">
          <Brand onClick={onHome} />

          <div className="workspace-user">
            <div className="user-avatar">
              {(user?.full_name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <strong>{user?.full_name || "User"}</strong>
              <span>{user?.role || "Member"}</span>
            </div>
            <button className="logout-button" onClick={onLogout} type="button">
              <LogOut size={15} /> Log out
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {feature ? (
          <FeaturePage
            key={feature}
            feature={feature}
            user={user}
            onBack={() => setFeature(null)}
          />
        ) : (
          <Dashboard key="dashboard" user={user} onOpen={setFeature} />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [page, setPage] = useState(() =>
    getSession() ? "workspace" : "home",
  );

  const handleLogin = (user) => {
    const current = getSession();
    const currentUser = user || current?.user;

    if (!currentUser) {
      setPage("auth");
      return;
    }

    localStorage.setItem(STORAGE.user, JSON.stringify(currentUser));

    setSession({
      token: localStorage.getItem(STORAGE.token) || current?.token,
      user: currentUser,
    });

    setPage("workspace");
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setPage("home");
  };

  const goHome = () => setPage("home");

  const enterPlatform = () => {
    const current = getSession();

    if (current) {
      setSession(current);
      setPage("workspace");
    } else {
      setPage("auth");
    }
  };

  useEffect(() => {
    if (!session?.token) return undefined;

    const expiry = Number(localStorage.getItem(STORAGE.expiry) || 0);
    if (!expiry) return undefined;

    const remaining = expiry - Date.now();

    if (remaining <= 0) {
      handleLogout();
      return undefined;
    }

    const timer = window.setTimeout(handleLogout, remaining);
    return () => window.clearTimeout(timer);
  }, [session]);

  return (
    <AnimatePresence mode="wait">
      {page === "home" && (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LandingPage onEnter={enterPlatform} />
        </motion.div>
      )}

      {page === "auth" && (
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Auth onBack={goHome} onLogin={handleLogin} />
        </motion.div>
      )}

      {page === "workspace" && session?.user && (
        <motion.div
          key="workspace"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Workspace
            user={session.user}
            onLogout={handleLogout}
            onHome={goHome}
          />
        </motion.div>
      )}

      {page === "workspace" && !session?.user && (
        <div className="session-message">
          <Droplet size={28} fill="currentColor" />
          <h2>Your session needs attention.</h2>
          <p>Please sign in again to continue.</p>
          <button
            className="primary-button"
            onClick={() => setPage("auth")}
            type="button"
          >
            Sign in <ArrowRight size={16} />
          </button>
        </div>
      )}
    </AnimatePresence>
  );
}