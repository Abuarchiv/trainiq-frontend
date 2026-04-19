"use client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useI18n } from "@/hooks/useI18n";
import { Bell, BellOff } from "lucide-react";

export function PushNotificationSettings() {
  const { permission, subscribed, loading, subscribe, unsubscribe, supported } = usePushNotifications();
  const { t } = useI18n();

  if (!supported) return null;

  return (
    <div className="px-5 py-5 border-b border-border">
      <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-4">{t("settings.notifications")}</p>
      {loading ? (
        <div className="h-12 bg-[#EBEBEB] animate-pulse" />
      ) : (
        <div className="flex items-center justify-between border border-border px-4 py-3">
          <div className="flex items-center gap-3">
            {subscribed ? <Bell size={16} className="text-blue" /> : <BellOff size={16} className="text-textDim" />}
            <div>
              <p className="text-xs tracking-widest uppercase font-sans text-textMain">Push</p>
              <p className={`text-xs font-sans mt-0.5 ${subscribed ? "text-blue" : "text-textDim"}`}>
                {subscribed ? `● ${t("settings.pushEnabled")}` : permission === "denied" ? `● ${t("settings.pushBlocked")}` : `○ ${t("settings.pushDisabled")}`}
              </p>
            </div>
          </div>
          {permission !== "denied" && (
            <button
              onClick={subscribed ? unsubscribe : subscribe}
              className={`border text-xs tracking-widest uppercase font-sans px-3 py-1.5 transition-colors ${
                subscribed
                  ? "border-border text-textDim hover:border-danger hover:text-danger"
                  : "border-blue text-blue hover:bg-blueDim"
              }`}
            >
              {subscribed ? t("settings.disablePush") : t("settings.enablePush")}
            </button>
          )}
        </div>
      )}
      <p className="text-[10px] font-sans text-textDim mt-2 leading-relaxed">
        {t("settings.pushDesc")}
      </p>
    </div>
  );
}
