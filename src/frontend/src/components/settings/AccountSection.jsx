import React, { useState, useEffect } from "react";
import { User, Lock, Link2, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import API_URL from "../../utils/apiConfig";
import {
  changeUsername,
  changePassword,
  fetchConnections,
  unlinkConnection,
} from "../../api";
import useToastStore from "../../store/useToastStore";

const PROVIDER_LABELS = { google: "Google", github: "GitHub" };

const AccountSection = ({ onPasswordChange }) => {
  const { user, checkAuth } = useAuth();
  const toast = useToastStore();

  const [connections, setConnections] = useState({ has_password: false, providers: [] });
  const [loaded, setLoaded] = useState(false);
  const [enabledProviders, setEnabledProviders] = useState([]);
  const [busy, setBusy] = useState(null);

  // Username edit
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.username || "");

  // Password form
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const loadConnections = () => {
    fetchConnections()
      .then(setConnections)
      .catch(() => {})
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    loadConnections();
    fetch(`${API_URL}/auth/providers`)
      .then((r) => (r.ok ? r.json() : { providers: [] }))
      .then((d) => setEnabledProviders(d.providers || []))
      .catch(() => setEnabledProviders([]));

    // Handle the return from a link flow.
    const params = new URLSearchParams(window.location.search);
    if (params.get("linked")) {
      toast.success(`${PROVIDER_LABELS[params.get("linked")] || "Account"} connected`);
      window.history.replaceState({}, "", "/settings");
    } else if (params.get("error") === "already_linked") {
      toast.error("That account is already connected to another GameGloom user");
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const saveUsername = async () => {
    if (!nameInput || nameInput === user.username) return setEditingName(false);
    setBusy("username");
    try {
      await changeUsername(nameInput);
      await checkAuth();
      toast.success("Username updated");
      setEditingName(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const savePassword = async () => {
    if (!newPw) return;
    setBusy("password");
    try {
      await changePassword(connections.has_password ? currentPw : null, newPw);
      toast.success(connections.has_password ? "Password changed" : "Password set");
      setPwOpen(false);
      setCurrentPw("");
      setNewPw("");
      loadConnections();
      onPasswordChange?.();  // let the parent (delete section) refresh has_password
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const handleUnlink = async (provider) => {
    setBusy(provider);
    try {
      await unlinkConnection(provider);
      toast.success(`${PROVIDER_LABELS[provider]} disconnected`);
      loadConnections();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const connectProvider = (provider) => {
    // Link to THIS account (not log in as whoever owns the identity).
    window.location.href = `${API_URL}/auth/${provider}/link`;
  };

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <h2 className="settings-card-title">Account</h2>
      </div>

      {/* Username */}
      <div className="clear-row-wrapper">
        <div className="clear-row" style={{ cursor: "default" }}>
          <div className="clear-row-icon"><User size={18} /></div>
          <div className="clear-row-content">
            <p className="clear-row-title">Username</p>
            {editingName ? (
              <div className="clear-confirm-actions" style={{ marginTop: 8 }}>
                <input
                  className="clear-confirm-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="New username"
                />
                <button className="clear-confirm-btn confirm" onClick={saveUsername} disabled={busy === "username"}>
                  {busy === "username" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button className="clear-confirm-btn cancel" onClick={() => { setEditingName(false); setNameInput(user.username); }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <p className="clear-row-meta">@{user.username}</p>
            )}
          </div>
          {!editingName && (
            <button className="integration-btn" onClick={() => setEditingName(true)}>Edit</button>
          )}
        </div>
      </div>

      {/* Password */}
      {loaded && (
      <div className={`clear-row-wrapper ${pwOpen ? "confirming" : ""}`}>
        <div className="clear-row" style={{ cursor: "default" }}>
          <div className="clear-row-icon"><Lock size={18} /></div>
          <div className="clear-row-content">
            <p className="clear-row-title">{connections.has_password ? "Change password" : "Set a password"}</p>
            <p className="clear-row-meta">
              {connections.has_password
                ? "Update your account password"
                : "You signed up with a social account — add a password to also log in directly"}
            </p>
          </div>
          <button className="integration-btn" onClick={() => setPwOpen((o) => !o)}>
            {pwOpen ? "Cancel" : connections.has_password ? "Change" : "Set"}
          </button>
        </div>
        {pwOpen && (
          <div className="clear-confirm-panel">
            {connections.has_password && (
              <input
                className="clear-confirm-input"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Current password"
              />
            )}
            <input
              className="clear-confirm-input"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password (min 10 chars)"
            />
            <div className="clear-confirm-actions">
              <button className="clear-confirm-btn confirm" onClick={savePassword} disabled={busy === "password" || newPw.length < 10}>
                {busy === "password" ? <Loader2 size={14} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Connected accounts */}
      <div className="settings-subheader">Connected accounts</div>
      {enabledProviders.map((provider) => {
        const linked = connections.providers.includes(provider);
        return (
          <div className="clear-row-wrapper" key={provider}>
            <div className="clear-row" style={{ cursor: "default" }}>
              <div className="clear-row-icon"><Link2 size={18} /></div>
              <div className="clear-row-content">
                <p className="clear-row-title">{PROVIDER_LABELS[provider] || provider}</p>
                <p className="clear-row-meta">{linked ? "Connected" : "Not connected"}</p>
              </div>
              {linked ? (
                <button className="integration-btn danger" onClick={() => handleUnlink(provider)} disabled={busy === provider}>
                  {busy === provider ? <Loader2 size={14} className="animate-spin" /> : "Disconnect"}
                </button>
              ) : (
                <button className="integration-btn" onClick={() => connectProvider(provider)}>Connect</button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default AccountSection;
