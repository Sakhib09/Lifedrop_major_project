import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Droplet, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound, Phone, Activity } from "lucide-react";
import api from "./api";
import "./Auth.css";

const ERROR_FALLBACK = "Something went wrong. Please try again.";

function getError(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(", ");
  if (error?.request) return "Could not reach the server. Make sure the backend is running.";
  return error?.message || ERROR_FALLBACK;
}

export default function Auth({ onBack, onLogin }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", role: "donor" });
  const isRegister = mode === "register";

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setSuccess("");
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (isRegister) {
        await api.post("/auth/register", {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: form.role,
        });
        setSuccess("Your account has been created. Sign in to continue.");
        setMode("login");
        setForm((current) => ({ ...current, password: "" }));
      } else {
        const response = await api.post("/auth/login", { email: form.email.trim(), password: form.password });
        const data = response.data;
        if (data?.access_token) {
          localStorage.setItem("lifedrop_token", data.access_token);
          localStorage.setItem("lifedrop_token_type", data.token_type || "bearer");
          if (data.expires_in) localStorage.setItem("lifedrop_token_expiry", String(Date.now() + Number(data.expires_in) * 1000));
        }
        if (data?.user) {
          localStorage.setItem("lifedrop_user", JSON.stringify(data.user));
          onLogin(data.user);
        } else {
          setError("The server signed you in but did not return user details. Please check the login response.");
        }
      }
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-topbar">
        <button className="auth-brand" onClick={onBack} type="button" aria-label="LifeDrop home">
          <span className="auth-brand-mark"><Droplet size={19} fill="currentColor" strokeWidth={1.6} /></span>
          <span>lifedrop<span className="auth-brand-period">.</span></span>
        </button>
        <button className="auth-back" onClick={onBack} type="button"><ArrowLeft size={15} /> Back to home</button>
      </header>

      <main className="auth-main">
        <section className="auth-story" aria-label="About LifeDrop">
          <div className="auth-story-topline"><span className="auth-live-dot" /> A MORE CONNECTED WAY TO CARE</div>
          <div className="auth-story-copy">
            <p className="auth-kicker">BLOOD CARE, BETTER CONNECTED</p>
            <h1>When it matters <em>most.</em></h1>
            <p className="auth-story-description">Bring donors, requests and important updates into one considered, easy-to-use space.</p>
            <div className="auth-story-rule" />
            <div className="auth-promise">
              <span className="auth-promise-icon"><Activity size={18} /></span>
              <div><strong>One platform. Clearer connections.</strong><span>Designed to help people coordinate when time matters.</span></div>
            </div>
          </div>
          <div className="auth-story-bottom"><span>01 — CONNECT</span><span>02 — COORDINATE</span><span>03 — CARE</span></div>
          <div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" />
          <div className="auth-watermark"><Droplet size={210} strokeWidth={0.55} /></div>
        </section>

        <section className="auth-form-side">
          <div className="auth-form-wrap">
            <div className="auth-form-heading">
              <span className="auth-form-eyebrow">YOUR LIFEDROP WORKSPACE</span>
              <h2>{isRegister ? "Create your account." : "Welcome back."}</h2>
              <p>{isRegister ? "A few details to get you started." : "Sign in to continue where you left off."}</p>
            </div>

            <div className="auth-mode-switch" role="tablist" aria-label="Account access">
              <button className={!isRegister ? "active" : ""} onClick={() => switchMode("login")} type="button" role="tab" aria-selected={!isRegister}>Sign in</button>
              <button className={isRegister ? "active" : ""} onClick={() => switchMode("register")} type="button" role="tab" aria-selected={isRegister}>Create account</button>
            </div>

            {error && <div className="auth-alert auth-alert-error" role="alert">{error}</div>}
            {success && <div className="auth-alert auth-alert-success"><CheckCircle2 size={16} />{success}</div>}

            <form className="auth-form" onSubmit={submit}>
              {isRegister && <>
                <label className="auth-field"><span>Full name</span><div className="auth-input-wrap"><UserRound size={17} /><input name="full_name" value={form.full_name} onChange={update} placeholder="Your full name" autoComplete="name" required /></div></label>
                <div className="auth-field-row">
                  <label className="auth-field"><span>Mobile number</span><div className="auth-input-wrap"><Phone size={17} /><input name="phone" value={form.phone} onChange={update} placeholder="Phone number" autoComplete="tel" required /></div></label>
                  <label className="auth-field"><span>Account type</span><select className="auth-select" name="role" value={form.role} onChange={update}><option value="donor">Donor</option><option value="requester">Requester</option></select></label>
                </div>
              </>}
              <label className="auth-field"><span>Email address</span><div className="auth-input-wrap"><Mail size={17} /><input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required /></div></label>
              <label className="auth-field"><span>Password</span><div className="auth-input-wrap"><LockKeyhole size={17} /><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={update} placeholder={isRegister ? "At least 8 characters" : "Enter your password"} autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 8 : undefined} required /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
              <button className="auth-submit" type="submit" disabled={busy}>{busy ? (isRegister ? "Creating account…" : "Signing in…") : (isRegister ? "Create your account" : "Sign in to LifeDrop")}<ArrowRight size={17} /></button>
            </form>

            <div className="auth-secure-note"><ShieldCheck size={16} /><span>Your account details are used to access your secure workspace.</span></div>
            <p className="auth-switch-copy">{isRegister ? "Already have an account?" : "New to LifeDrop?"} <button type="button" onClick={() => switchMode(isRegister ? "login" : "register")}>{isRegister ? "Sign in" : "Create an account"}</button></p>
          </div>
        </section>
      </main>
      <footer className="auth-footer"><span>lifedrop<span className="auth-brand-period">.</span></span><span>Academic project · Demonstration platform</span></footer>
    </div>
  );
}
