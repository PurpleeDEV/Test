import { useEffect, useState, type FormEvent } from "react";

const API_URL = "http://localhost:3001";

type RequestStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "completed"
  | "cancelled";

type Request = {
  id: number;
  package_name: string;
  name: string;
  phone: string;
  email: string;
  company?: string | null;
  message?: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at?: string;
};

type Log = {
  id: number;
  request_id: number;
  action: string;
  package_name: string;
  name: string;
  phone: string;
  email: string;
  company?: string | null;
  message?: string | null;
  status: string;
  deleted_at: string;
};

type SupportConversation = {
  id: number;
  session_id: string;
  name?: string | null;
  email?: string | null;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  message_count: number;
  unread_count: number;
  last_message?: string | null;
};

type SupportMessage = {
  id: number;
  sender: "user" | "admin";
  message: string;
  created_at: string;
  read_at?: string | null;
};

type SupportConversationLog = {
  id: number;
  conversation_id: number;
  session_id: string;
  name?: string | null;
  email?: string | null;
  status: "open" | "closed";
  message_count: number;
  unread_count: number;
  deleted_at: string;
};

const statusLabels: Record<RequestStatus, string> = {
  new: "Yeni",
  contacted: "İletişime Geçildi",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(() => {
    return localStorage.getItem("taffyweb_admin") === "true";
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [requests, setRequests] = useState<Request[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [supportConversations, setSupportConversations] = useState<
    SupportConversation[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportMessagesLoading, setSupportMessagesLoading] = useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState<Request | null>(null);

  const [selectedConversation, setSelectedConversation] =
    useState<SupportConversation | null>(null);

  const [supportMessages, setSupportMessages] = useState<
    SupportMessage[]
  >([]);

  const [supportReply, setSupportReply] = useState("");
  const [sendingSupportReply, setSendingSupportReply] = useState(false);

  const [supportLogs, setSupportLogs] = useState<
  SupportConversationLog[]
>([]);

const [supportLogsLoading, setSupportLogsLoading] = useState(false);

const [deletingConversationId, setDeletingConversationId] = useState<
  number | null
>(null);

  const [activeTab, setActiveTab] = useState<
    "requests" | "support" | "logs"
  >("requests");

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch(API_URL + "/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Giriş başarısız.");
        return;
      }

      localStorage.setItem("taffyweb_admin", "true");
      setLoggedIn(true);
    } catch {
      alert("Sunucuya bağlanılamadı.");
    }
  };

  const loadRequests = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        API_URL + "/api/admin/requests",
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Talepler alınamadı.");
      }

      setRequests(data.requests || []);
    } catch (error) {
      console.error(error);
      alert("Başvurular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);

    try {
      const response = await fetch(API_URL + "/api/admin/logs");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Loglar alınamadı.");
      }

      setLogs(data.logs || []);
    } catch (error) {
      console.error(error);
      alert("Silinen başvurular yüklenemedi.");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
      loadSupportLogs();
    }
  }, [activeTab]);

  const loadSupportConversations = async () => {
    setSupportLoading(true);

    try {
      const response = await fetch(
        API_URL + "/api/admin/support/conversations",
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Destek sohbetleri alınamadı.",
        );
      }

      setSupportConversations(data.conversations || []);
    } catch (error) {
      console.error(error);
    } finally {
      setSupportLoading(false);
    }
  };

  const loadSupportLogs = async () => {
    setSupportLogsLoading(true);
  
    try {
      const response = await fetch(
        API_URL + "/api/admin/support/logs",
      );
  
      const data = await response.json();
  
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Canlı destek logları alınamadı.",
        );
      }
  
      setSupportLogs(data.logs || []);
    } catch (error) {
      console.error(error);
      alert("Canlı destek logları yüklenemedi.");
    } finally {
      setSupportLogsLoading(false);
    }
  };

  const deleteSupportConversation = async (
    conversationId: number,
  ) => {
    const confirmed = window.confirm(
      "Bu canlı destek sohbetini silmek istediğinize emin misiniz?\n\n" +
        "Sohbet ve mesajları silinecek ancak loglarda saklanacaktır.",
    );
  
    if (!confirmed) {
      return;
    }
  
    setDeletingConversationId(conversationId);
  
    try {
      const response = await fetch(
        API_URL +
          "/api/admin/support/conversations/" +
          conversationId,
        {
          method: "DELETE",
        },
      );
  
      const data = await response.json();
  
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Sohbet silinemedi.",
        );
      }
  
      // Liste içerisinden silinen sohbeti kaldır
      setSupportConversations((current) =>
        current.filter(
          (conversation) =>
            conversation.id !== conversationId,
        ),
      );
  
      // Eğer silinen sohbet seçiliyse sağ paneli temizle
      if (
        selectedConversation?.id === conversationId
      ) {
        setSelectedConversation(null);
        setSupportMessages([]);
      }
  
      // Logları güncelle
      await loadSupportLogs();
  
      alert(
        "Canlı destek sohbeti silindi ve loglandı.",
      );
    } catch (error) {
      console.error(error);
  
      alert(
        error instanceof Error
          ? error.message
          : "Sohbet silinemedi.",
      );
    } finally {
      setDeletingConversationId(null);
    }
  };

  const loadSupportMessages = async (
    conversationId: number,
  ) => {
    setSupportMessagesLoading(true);

    try {
      const response = await fetch(
        API_URL +
          "/api/admin/support/conversations/" +
          conversationId +
          "/messages",
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Destek mesajları alınamadı.",
        );
      }

      setSupportMessages(data.messages || []);
    } catch (error) {
      console.error(error);
      setSupportMessages([]);
    } finally {
      setSupportMessagesLoading(false);
    }
  };

  const selectConversation = async (
    conversation: SupportConversation,
  ) => {
    setSelectedConversation(conversation);
    setSupportMessages([]);
    await loadSupportMessages(conversation.id);
  };

  const sendSupportReply = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedMessage = supportReply.trim();

    if (
      !selectedConversation ||
      !trimmedMessage ||
      sendingSupportReply
    ) {
      return;
    }

    setSendingSupportReply(true);

    try {
      const response = await fetch(
        API_URL +
          "/api/admin/support/conversations/" +
          selectedConversation.id +
          "/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedMessage,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Cevap gönderilemedi.",
        );
      }

      setSupportReply("");

      await loadSupportMessages(selectedConversation.id);
      await loadSupportConversations();

      const updatedConversation =
        supportConversations.find(
          (item) => item.id === selectedConversation.id,
        );

      if (updatedConversation) {
        setSelectedConversation({
          ...updatedConversation,
          status: "open",
        });
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Cevap gönderilirken hata oluştu.",
      );
    } finally {
      setSendingSupportReply(false);
    }
  };

  const updateSupportStatus = async (
    conversationId: number,
    status: "open" | "closed",
  ) => {
    try {
      const response = await fetch(
        API_URL +
          "/api/admin/support/conversations/" +
          conversationId +
          "/status",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Destek durumu güncellenemedi.",
        );
      }

      setSupportConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                status,
              }
            : conversation,
        ),
      );

      if (
        selectedConversation &&
        selectedConversation.id === conversationId
      ) {
        setSelectedConversation({
          ...selectedConversation,
          status,
        });
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Destek durumu güncellenemedi.",
      );
    }
  };

  const deleteRequest = async (requestId: number) => {
    const confirmed = window.confirm(
      "Bu başvuruyu silmek istediğine emin misin?\n\nSilinen başvuru Loglar bölümünde saklanacaktır.",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        API_URL + "/api/admin/requests/" + requestId,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Başvuru silinemedi.",
        );
      }

      setRequests((current) =>
        current.filter((request) => request.id !== requestId),
      );

      setSelectedRequest(null);

      await loadLogs();

      alert("Başvuru silindi ve log kaydı oluşturuldu.");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Başvuru silinirken hata oluştu.",
      );
    }
  };

  const updateStatus = async (
    requestId: number,
    status: RequestStatus,
  ) => {
    try {
      const response = await fetch(
        API_URL +
          "/api/admin/requests/" +
          requestId +
          "/status",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Durum güncellenemedi.",
        );
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status,
              }
            : request,
        ),
      );

      if (
        selectedRequest &&
        selectedRequest.id === requestId
      ) {
        setSelectedRequest({
          ...selectedRequest,
          status,
        });
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Durum güncellenirken hata oluştu.",
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("taffyweb_admin");
    setLoggedIn(false);
  };

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    loadRequests();
    loadLogs();
    loadSupportConversations();
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn || activeTab !== "support") {
      return;
    }

    const interval = window.setInterval(() => {
      loadSupportConversations();

      if (selectedConversation) {
        loadSupportMessages(selectedConversation.id);
      }
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loggedIn, activeTab, selectedConversation]);

  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background:
            "radial-gradient(circle at top, rgba(124,58,237,.18), transparent 45%), #08080d",
          color: "#fff",
        }}
      >
        <form
          onSubmit={login}
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "32px",
            borderRadius: "24px",
            background: "rgba(20,20,30,.82)",
            border: "1px solid rgba(255,255,255,.08)",
            boxShadow: "0 24px 80px rgba(0,0,0,.45)",
          }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              display: "grid",
              placeItems: "center",
              marginBottom: "20px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg,#7c3aed,#a855f7)",
              fontSize: "24px",
              fontWeight: 900,
            }}
          >
            P
          </div>

          <h1 style={{ margin: 0 }}>PurpleWeb</h1>

          <p
            style={{
              marginTop: "8px",
              marginBottom: "28px",
              color: "#a1a1aa",
            }}
          >
            Yönetim paneline giriş yap
          </p>

          <input
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            placeholder="Kullanıcı adı"
            autoComplete="username"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 16px",
              marginBottom: "12px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,.1)",
              background: "#111118",
              color: "#fff",
              outline: "none",
            }}
          />

          <input
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Şifre"
            type="password"
            autoComplete="current-password"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 16px",
              marginBottom: "16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,.1)",
              background: "#111118",
              color: "#fff",
              outline: "none",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              minHeight: "48px",
              border: 0,
              borderRadius: "12px",
              background:
                "linear-gradient(135deg,#7c3aed,#a855f7)",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Giriş Yap
          </button>
        </form>
      </div>
    );
  }

  const openSupportCount = supportConversations.filter(
    (conversation) => conversation.status === "open",
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08080d",
        color: "#fff",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "18px 24px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          background: "rgba(10,10,16,.9)",
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(16px)",
        }}
      >
        <div>
          <strong style={{ fontSize: "20px" }}>
            PurpleWeb
          </strong>

          <div
            style={{
              color: "#a1a1aa",
              fontSize: "13px",
              marginTop: "3px",
            }}
          >
            Yönetim Paneli
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => {
              loadRequests();
              loadLogs();
              loadSupportConversations();
            }}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border:
                "1px solid rgba(255,255,255,.1)",
              background: "#111118",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ↻ Yenile
          </button>

          <button
            type="button"
            onClick={logout}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border:
                "1px solid rgba(255,255,255,.1)",
              background: "#111118",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Çıkış
          </button>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "28px 24px 60px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderRadius: "18px",
              background: "#111118",
              border:
                "1px solid rgba(255,255,255,.07)",
            }}
          >
            <div
              style={{
                color: "#a1a1aa",
                fontSize: "13px",
              }}
            >
              Aktif Başvurular
            </div>

            <strong
              style={{
                display: "block",
                marginTop: "8px",
                fontSize: "30px",
              }}
            >
              {requests.length}
            </strong>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg,rgba(124,58,237,.18),rgba(168,85,247,.08))",
              border:
                "1px solid rgba(168,85,247,.2)",
            }}
          >
            <div
              style={{
                color: "#c4b5fd",
                fontSize: "13px",
              }}
            >
              Açık Destek Sohbetleri
            </div>

            <strong
              style={{
                display: "block",
                marginTop: "8px",
                fontSize: "30px",
              }}
            >
              {openSupportCount}
            </strong>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "18px",
              background: "#111118",
              border:
                "1px solid rgba(255,255,255,.07)",
            }}
          >
            <div
              style={{
                color: "#a1a1aa",
                fontSize: "13px",
              }}
            >
              Silinen Başvurular
            </div>

            <strong
              style={{
                display: "block",
                marginTop: "8px",
                fontSize: "30px",
              }}
            >
              {logs.length}
            </strong>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg,rgba(34,197,94,.12),rgba(20,20,30,.8))",
              border:
                "1px solid rgba(34,197,94,.15)",
            }}
          >
            <div
              style={{
                color: "#86efac",
                fontSize: "13px",
              }}
            >
              Toplam Destek Sohbeti
            </div>

            <strong
              style={{
                display: "block",
                marginTop: "8px",
                fontSize: "30px",
              }}
            >
              {supportConversations.length}
            </strong>
          </div>
        </div>

        <section
          style={{
            background: "#111118",
            border:
              "1px solid rgba(255,255,255,.07)",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "16px",
              borderBottom:
                "1px solid rgba(255,255,255,.07)",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              style={{
                padding: "11px 15px",
                borderRadius: "11px",
                border:
                  "1px solid rgba(255,255,255,.08)",
                background:
                  activeTab === "requests"
                    ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                    : "#181820",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Başvurular
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("support");
                loadSupportConversations();
              }}
              style={{
                padding: "11px 15px",
                borderRadius: "11px",
                border:
                  "1px solid rgba(255,255,255,.08)",
                background:
                  activeTab === "support"
                    ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                    : "#181820",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              💬 Canlı Destek
              {openSupportCount > 0 && (
                <span
                  style={{
                    marginLeft: "8px",
                    padding: "3px 7px",
                    borderRadius: "999px",
                    background: "#22c55e",
                    color: "#07120a",
                    fontSize: "11px",
                    fontWeight: 900,
                  }}
                >
                  {openSupportCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("logs");
                loadLogs();
              }}
              style={{
                padding: "11px 15px",
                borderRadius: "11px",
                border:
                  "1px solid rgba(255,255,255,.08)",
                background:
                  activeTab === "logs"
                    ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                    : "#181820",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🗑️ Silinen Başvurular / Loglar
            </button>
          </div>

          {activeTab === "requests" && (
            <>
              <div
                style={{
                  padding: "20px",
                  borderBottom:
                    "1px solid rgba(255,255,255,.07)",
                }}
              >
                <h2 style={{ margin: 0 }}>Başvurular</h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#a1a1aa",
                    fontSize: "14px",
                  }}
                >
                  Gelen müşteri taleplerini buradan
                  yönetebilirsin.
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                {loading ? (
                  <div
                    style={{
                      padding: "40px",
                      color: "#a1a1aa",
                    }}
                  >
                    Başvurular yükleniyor...
                  </div>
                ) : requests.length === 0 ? (
                  <div
                    style={{
                      padding: "40px",
                      color: "#a1a1aa",
                    }}
                  >
                    Henüz başvuru bulunmuyor.
                  </div>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "850px",
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "ID",
                          "Müşteri",
                          "Paket",
                          "İletişim",
                          "Durum",
                          "Tarih",
                        ].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              padding: "14px 18px",
                              textAlign: "left",
                              color: "#a1a1aa",
                              fontSize: "12px",
                              borderBottom:
                                "1px solid rgba(255,255,255,.07)",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {requests.map((request) => (
                        <tr
                          key={request.id}
                          onClick={() =>
                            setSelectedRequest(request)
                          }
                          style={{
                            cursor: "pointer",
                            borderBottom:
                              "1px solid rgba(255,255,255,.05)",
                          }}
                        >
                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            #{request.id}
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            <strong>{request.name}</strong>

                            {request.company && (
                              <div
                                style={{
                                  marginTop: "4px",
                                  color: "#a1a1aa",
                                  fontSize: "12px",
                                }}
                              >
                                {request.company}
                              </div>
                            )}
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            {request.package_name}
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            <div>{request.phone}</div>

                            <div
                              style={{
                                color: "#a1a1aa",
                                fontSize: "12px",
                                marginTop: "3px",
                              }}
                            >
                              {request.email}
                            </div>
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            <select
                              value={request.status}
                              onChange={(event) =>
                                updateStatus(
                                  request.id,
                                  event.target.value as RequestStatus,
                                )
                              }
                              style={{
                                padding: "8px 10px",
                                borderRadius: "9px",
                                border:
                                  "1px solid rgba(255,255,255,.1)",
                                background: "#191923",
                                color: "#fff",
                              }}
                            >
                              {Object.entries(
                                statusLabels,
                              ).map(([value, label]) => (
                                <option
                                  key={value}
                                  value={value}
                                >
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            {new Date(
                              request.created_at,
                            ).toLocaleString("tr-TR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            
              <div
  style={{
    padding: "20px",
    borderTop: "1px solid rgba(255,255,255,.07)",
  }}
>
  <h2 style={{ margin: 0 }}>
  <div
  style={{
    padding: "20px",
    borderTop: "1px solid rgba(255,255,255,.07)",
  }}
>
  <h2 style={{ margin: 0 }}>
  <div
  style={{
    padding: "20px",
    borderTop: "1px solid rgba(255,255,255,.07)",
  }}
>
  <h2 style={{ margin: 0 }}>
    💬 Silinen Canlı Destek Sohbetleri
  </h2>

  <p
    style={{
      margin: "6px 0 0",
      color: "#a1a1aa",
      fontSize: "14px",
    }}
  >
    Silinen canlı destek görüşmeleri burada saklanır.
  </p>
</div>

<div style={{ overflowX: "auto" }}>
  {supportLogsLoading ? (
    <div
      style={{
        padding: "40px",
        color: "#a1a1aa",
      }}
    >
      Canlı destek logları yükleniyor...
    </div>
  ) : supportLogs.length === 0 ? (
    <div
      style={{
        padding: "40px",
        color: "#a1a1aa",
      }}
    >
      Henüz silinmiş canlı destek sohbeti bulunmuyor.
    </div>
  ) : (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "850px",
      }}
    >
      <thead>
        <tr>
          {[
            "ID",
            "Müşteri",
            "E-posta",
            "Mesaj",
            "Durum",
            "Silinme Tarihi",
          ].map((heading) => (
            <th
              key={heading}
              style={{
                padding: "14px 18px",
                textAlign: "left",
                color: "#a1a1aa",
                fontSize: "12px",
                borderBottom:
                  "1px solid rgba(255,255,255,.07)",
              }}
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {supportLogs.map((log) => (
          <tr
            key={log.id}
            style={{
              borderBottom:
                "1px solid rgba(255,255,255,.05)",
            }}
          >
            <td style={{ padding: "16px 18px" }}>
              #{log.id}
            </td>

            <td style={{ padding: "16px 18px" }}>
              <strong>
                {log.name || "İsimsiz müşteri"}
              </strong>

              <div
                style={{
                  marginTop: "4px",
                  color: "#71717a",
                  fontSize: "11px",
                }}
              >
                #{log.conversation_id}
              </div>
            </td>

            <td style={{ padding: "16px 18px" }}>
              {log.email || "E-posta yok"}
            </td>

            <td style={{ padding: "16px 18px" }}>
              {log.message_count} mesaj
            </td>

            <td style={{ padding: "16px 18px" }}>
              <span
                style={{
                  color:
                    log.status === "open"
                      ? "#4ade80"
                      : "#71717a",
                  fontWeight: 700,
                }}
              >
                {log.status === "open"
                  ? "Açık"
                  : "Kapalı"}
              </span>
            </td>

            <td style={{ padding: "16px 18px" }}>
              {new Date(
                log.deleted_at,
              ).toLocaleString("tr-TR")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

      <tbody>
        {supportLogs.map((log) => (
          <tr
            key={log.id}
            style={{
              borderBottom:
                "1px solid rgba(255,255,255,.05)",
            }}
          >
            <td style={{ padding: "16px 18px" }}>
              #{log.id}
            </td>

            <td style={{ padding: "16px 18px" }}>
              <strong>
                {log.name || "İsimsiz müşteri"}
              </strong>

              <div
                style={{
                  marginTop: "4px",
                  color: "#71717a",
                  fontSize: "11px",
                }}
              >
                #{log.conversation_id}
              </div>
            </td>

            <td style={{ padding: "16px 18px" }}>
              {log.email || "E-posta yok"}
            </td>

            <td style={{ padding: "16px 18px" }}>
              {log.message_count} mesaj
            </td>

            <td style={{ padding: "16px 18px" }}>
              <span
                style={{
                  color:
                    log.status === "open"
                      ? "#4ade80"
                      : "#71717a",
                  fontWeight: 700,
                }}
              >
                {log.status === "open"
                  ? "Açık"
                  : "Kapalı"}
              </span>
            </td>

            <td style={{ padding: "16px 18px" }}>
              {new Date(
                log.deleted_at,
              ).toLocaleString("tr-TR")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>


            </>
          )}

          {activeTab === "support" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(260px, 0.75fr) minmax(0, 1.5fr)",
                minHeight: "650px",
              }}
            >
              <div
                style={{
                  borderRight:
                    "1px solid rgba(255,255,255,.07)",
                  background: "#0f0f15",
                }}
              >
                <div
                  style={{
                    padding: "18px",
                    borderBottom:
                      "1px solid rgba(255,255,255,.07)",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                    }}
                  >
                    Canlı Destek
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#92929d",
                      fontSize: "12px",
                    }}
                  >
                    Müşterilerden gelen sohbetler.
                  </p>
                </div>

                <div
                  style={{
                    maxHeight: "590px",
                    overflowY: "auto",
                  }}
                >
                  {supportLoading ? (
                    <div
                      style={{
                        padding: "30px 18px",
                        color: "#92929d",
                      }}
                    >
                      Sohbetler yükleniyor...
                    </div>
                  ) : supportConversations.length === 0 ? (
                    <div
                      style={{
                        padding: "30px 18px",
                        color: "#92929d",
                      }}
                    >
                      Henüz canlı destek sohbeti yok.
                    </div>
                  ) : (
                    supportConversations.map(
                      (conversation) => (
                        <div
                        key={conversation.id}
                        onClick={() => selectConversation(conversation)}
                        style={{
                          position: "relative",
                          display: "block",
                          width: "100%",
                          padding: "16px 18px",
                          borderBottom:
                            "1px solid rgba(255,255,255,.05)",
                          background:
                            selectedConversation?.id === conversation.id
                              ? "rgba(124,58,237,.16)"
                              : "transparent",
                          color: "#fff",
                          textAlign: "left",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                      >

<button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    deleteSupportConversation(conversation.id);
  }}
  disabled={deletingConversationId === conversation.id}
  style={{
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "30px",
    height: "30px",
    border: "1px solid rgba(239,68,68,.25)",
    borderRadius: "8px",
    background: "rgba(239,68,68,.08)",
    color: "#f87171",
    cursor:
      deletingConversationId === conversation.id
        ? "not-allowed"
        : "pointer",
    opacity:
      deletingConversationId === conversation.id
        ? 0.5
        : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  }}
  title="Sohbeti sil"
>
  {deletingConversationId === conversation.id
    ? "..."
    : "🗑️"}
</button>

                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              gap: "10px",
                            }}
                          >

<button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    deleteSupportConversation(conversation.id);
  }}
  disabled={
    deletingConversationId === conversation.id
  }
  style={{
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "30px",
    height: "30px",
    border: "1px solid rgba(239,68,68,.25)",
    borderRadius: "8px",
    background: "rgba(239,68,68,.08)",
    color: "#f87171",
    cursor:
      deletingConversationId === conversation.id
        ? "not-allowed"
        : "pointer",
    opacity:
      deletingConversationId === conversation.id
        ? 0.5
        : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  }}
  title="Sohbeti sil"
>
  {deletingConversationId === conversation.id
    ? "..."
    : "🗑️"}
</button>

                            <strong
                              style={{
                                fontSize: "13px",
                              }}
                            >
                              {conversation.name ||
                                "Müşteri #" +
                                  conversation.id}
                            </strong>

                            <span
                              style={{
                                color:
                                  conversation.status ===
                                  "open"
                                    ? "#4ade80"
                                    : "#71717a",
                                fontSize: "11px",
                                fontWeight: 800,
                              }}
                            >
                              {conversation.status === "open"
                                ? "Açık"
                                : "Kapalı"}
                            </span>
                          </div>

                          <div
                            style={{
                              marginTop: "5px",
                              color: "#8f8f99",
                              fontSize: "11px",
                            }}
                          >
                            {conversation.email ||
                              conversation.session_id}
                          </div>

                          <div
                            style={{
                              marginTop: "9px",
                              color: "#c8c8d0",
                              fontSize: "12px",
                              lineHeight: 1.5,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {conversation.last_message ||
                              "Henüz mesaj yok."}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              marginTop: "9px",
                              color: "#6f6f79",
                              fontSize: "10px",
                            }}
                          >
                            <span>
                              {conversation.message_count} mesaj
                            </span>

                            <span>
                              {new Date(
                                conversation.updated_at,
                              ).toLocaleString("tr-TR")}
                            </span>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                }}
              >
                {!selectedConversation ? (
                  <div
                    style={{
                      flex: 1,
                      display: "grid",
                      placeItems: "center",
                      padding: "40px",
                      color: "#777783",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "42px",
                          marginBottom: "12px",
                        }}
                      >
                        💬
                      </div>

                      <strong
                        style={{
                          display: "block",
                          color: "#d4d4dc",
                          fontSize: "17px",
                        }}
                      >
                        Bir sohbet seç
                      </strong>

                      <p
                        style={{
                          marginTop: "7px",
                          fontSize: "13px",
                        }}
                      >
                        Müşterinin mesajlarını görmek ve cevap
                        vermek için soldan bir sohbet seç.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: "16px",
                        padding: "18px 20px",
                        borderBottom:
                          "1px solid rgba(255,255,255,.07)",
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            fontSize: "16px",
                          }}
                        >
                          {selectedConversation.name ||
                            "Müşteri #" +
                              selectedConversation.id}
                        </strong>

                        <div
                          style={{
                            marginTop: "4px",
                            color: "#8f8f99",
                            fontSize: "11px",
                          }}
                        >
                          {selectedConversation.email ||
                            selectedConversation.session_id}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <select
                          value={selectedConversation.status}
                          onChange={(event) =>
                            updateSupportStatus(
                              selectedConversation.id,
                              event.target.value as
                                | "open"
                                | "closed",
                            )
                          }
                          style={{
                            minHeight: "38px",
                            padding: "0 11px",
                            borderRadius: "9px",
                            border:
                              "1px solid rgba(255,255,255,.1)",
                            background: "#191923",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                        >
                          <option value="open">
                            Açık
                          </option>
                          <option value="closed">
                            Kapalı
                          </option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedConversation(null);
                            setSupportMessages([]);
                          }}
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "9px",
                            border:
                              "1px solid rgba(255,255,255,.1)",
                            background: "#191923",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                          aria-label="Sohbeti kapat"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minHeight: "0",
                        overflowY: "auto",
                        padding: "22px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        background:
                          "radial-gradient(circle at top right, rgba(124,58,237,.08), transparent 35%), #0b0b10",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "76%",
                          alignSelf: "flex-start",
                          padding: "12px 14px",
                          borderRadius:
                            "14px 14px 14px 5px",
                          background:
                            "rgba(255,255,255,.05)",
                          border:
                            "1px solid rgba(255,255,255,.06)",
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            marginBottom: "5px",
                            color: "#a78bfa",
                            fontSize: "11px",
                          }}
                        >
                          PurpleWeb
                        </strong>

                        <p
                          style={{
                            margin: 0,
                            color: "#ddd6e5",
                            fontSize: "12px",
                            lineHeight: 1.6,
                          }}
                        >
                          Canlı destek sohbetine hoş
                          geldiniz.
                        </p>
                      </div>

                      {supportMessagesLoading ? (
                        <div
                          style={{
                            padding: "20px 0",
                            color: "#71717a",
                            fontSize: "12px",
                          }}
                        >
                          Mesajlar yükleniyor...
                        </div>
                      ) : supportMessages.length === 0 ? (
                        <div
                          style={{
                            padding: "20px 0",
                            color: "#71717a",
                            fontSize: "12px",
                          }}
                        >
                          Henüz mesaj yok.
                        </div>
                      ) : (
                        supportMessages.map((message) => {
                          const isAdmin =
                            message.sender === "admin";

                          return (
                            <div
                              key={message.id}
                              style={{
                                width: "fit-content",
                                maxWidth: "76%",
                                alignSelf: isAdmin
                                  ? "flex-end"
                                  : "flex-start",
                                padding: "12px 14px",
                                borderRadius: isAdmin
                                  ? "14px 14px 5px 14px"
                                  : "14px 14px 14px 5px",
                                background: isAdmin
                                  ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                                  : "rgba(255,255,255,.055)",
                                border:
                                  "1px solid rgba(255,255,255,.07)",
                              }}
                            >
                              <strong
                                style={{
                                  display: "block",
                                  marginBottom: "5px",
                                  color: isAdmin
                                    ? "#ede9fe"
                                    : "#a78bfa",
                                  fontSize: "11px",
                                }}
                              >
                                {isAdmin
                                  ? "PurpleWeb"
                                  : "Müşteri"}
                              </strong>

                              <p
                                style={{
                                  margin: 0,
                                  color: "#f8f5ff",
                                  fontSize: "13px",
                                  lineHeight: 1.6,
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {message.message}
                              </p>

                              <span
                                style={{
                                  display: "block",
                                  marginTop: "6px",
                                  color: isAdmin
                                    ? "rgba(255,255,255,.6)"
                                    : "#777783",
                                  fontSize: "9px",
                                }}
                              >
                                {new Date(
                                  message.created_at,
                                ).toLocaleString("tr-TR")}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form
                      onSubmit={sendSupportReply}
                      style={{
                        display: "flex",
                        gap: "9px",
                        padding: "13px",
                        borderTop:
                          "1px solid rgba(255,255,255,.07)",
                        background: "#111118",
                      }}
                    >
                      <input
                        value={supportReply}
                        onChange={(event) =>
                          setSupportReply(event.target.value)
                        }
                        placeholder="Müşteriye cevap yaz..."
                        disabled={sendingSupportReply}
                        style={{
                          minWidth: "0",
                          flex: 1,
                          height: "45px",
                          padding: "0 13px",
                          borderRadius: "11px",
                          border:
                            "1px solid rgba(255,255,255,.09)",
                          background: "#181820",
                          color: "#fff",
                          outline: "none",
                        }}
                      />

                      <button
                        type="submit"
                        disabled={
                          sendingSupportReply ||
                          !supportReply.trim()
                        }
                        style={{
                          minWidth: "100px",
                          border: 0,
                          borderRadius: "11px",
                          background:
                            "linear-gradient(135deg,#8b5cf6,#6d28d9)",
                          color: "#fff",
                          fontWeight: 800,
                          cursor: "pointer",
                          opacity:
                            sendingSupportReply ||
                            !supportReply.trim()
                              ? 0.55
                              : 1,
                        }}
                      >
                        {sendingSupportReply
                          ? "..."
                          : "Gönder →"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <>
              <div
                style={{
                  padding: "20px",
                  borderBottom:
                    "1px solid rgba(255,255,255,.07)",
                }}
              >
                <h2 style={{ margin: 0 }}>
                  Silinen Başvurular / Loglar
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#a1a1aa",
                    fontSize: "14px",
                  }}
                >
                  Silinen başvurular burada saklanır.
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                {logsLoading ? (
                  <div
                    style={{
                      padding: "40px",
                      color: "#a1a1aa",
                    }}
                  >
                    Loglar yükleniyor...
                  </div>
                ) : logs.length === 0 ? (
                  <div
                    style={{
                      padding: "40px",
                      color: "#a1a1aa",
                    }}
                  >
                    Henüz silinmiş başvuru bulunmuyor.
                  </div>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "1000px",
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "Log ID",
                          "Eski ID",
                          "Müşteri",
                          "Paket",
                          "İletişim",
                          "Durum",
                          "Silinme Tarihi",
                        ].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              padding: "14px 18px",
                              textAlign: "left",
                              color: "#a1a1aa",
                              fontSize: "12px",
                              borderBottom:
                                "1px solid rgba(255,255,255,.07)",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          style={{
                            borderBottom:
                              "1px solid rgba(255,255,255,.05)",
                          }}
                        >
                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            #{log.id}
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            #{log.request_id}
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            <strong>{log.name}</strong>

                            {log.company && (
                              <div
                                style={{
                                  marginTop: "4px",
                                  color: "#a1a1aa",
                                  fontSize: "12px",
                                }}
                              >
                                {log.company}
                              </div>
                            )}
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            {log.package_name}
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            <div>{log.phone}</div>

                            <div
                              style={{
                                marginTop: "3px",
                                color: "#a1a1aa",
                                fontSize: "12px",
                              }}
                            >
                              {log.email}
                            </div>
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            {statusLabels[
                              log.status as RequestStatus
                            ] || log.status}
                          </td>

                          <td
                            style={{
                              padding: "16px 18px",
                            }}
                          >
                            {new Date(
                              log.deleted_at,
                            ).toLocaleString("tr-TR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {selectedRequest && (
        <div
          onClick={() => setSelectedRequest(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            padding: "20px",
            background: "rgba(0,0,0,.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "620px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "26px",
              borderRadius: "22px",
              background: "#111118",
              border:
                "1px solid rgba(255,255,255,.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>
                  Başvuru #{selectedRequest.id}
                </h2>

                <div
                  style={{
                    marginTop: "5px",
                    color: "#a1a1aa",
                  }}
                >
                  {selectedRequest.name}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRequest(null)
                }
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  border:
                    "1px solid rgba(255,255,255,.1)",
                  background: "#191923",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <div>
                <span style={{ color: "#a1a1aa" }}>
                  Paket
                </span>

                <div>{selectedRequest.package_name}</div>
              </div>

              <div>
                <span style={{ color: "#a1a1aa" }}>
                  Telefon
                </span>

                <div>{selectedRequest.phone}</div>
              </div>

              <div>
                <span style={{ color: "#a1a1aa" }}>
                  E-posta
                </span>

                <div>{selectedRequest.email}</div>
              </div>

              {selectedRequest.company && (
                <div>
                  <span
                    style={{ color: "#a1a1aa" }}
                  >
                    Şirket
                  </span>

                  <div>{selectedRequest.company}</div>
                </div>
              )}

              <div>
                <span style={{ color: "#a1a1aa" }}>
                  Mesaj
                </span>

                <div
                  style={{
                    marginTop: "5px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedRequest.message ||
                    "Mesaj bulunmuyor."}
                </div>
              </div>

              <div>
                <span style={{ color: "#a1a1aa" }}>
                  Durum
                </span>

                <select
                  value={selectedRequest.status}
                  onChange={(event) =>
                    updateStatus(
                      selectedRequest.id,
                      event.target.value as RequestStatus,
                    )
                  }
                  style={{
                    display: "block",
                    marginTop: "6px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border:
                      "1px solid rgba(255,255,255,.1)",
                    background: "#191923",
                    color: "#fff",
                  }}
                >
                  {Object.entries(
                    statusLabels,
                  ).map(([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "26px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  deleteRequest(selectedRequest.id)
                }
                style={{
                  minHeight: "44px",
                  padding: "0 18px",
                  border:
                    "1px solid rgba(239,68,68,.35)",
                  borderRadius: "12px",
                  background:
                    "rgba(239,68,68,.1)",
                  color: "#f87171",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🗑️ Sil
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedRequest(null)
                }
                style={{
                  minHeight: "44px",
                  padding: "0 18px",
                  border:
                    "1px solid rgba(255,255,255,.1)",
                  borderRadius: "12px",
                  background: "#191923",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}