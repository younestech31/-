'use client';

// components/FamilyTree/FamilyNode.tsx
// يتطلب: npm install reactflow
// الاستخدام: سجّل هذا الـ component كـ nodeTypes في ReactFlow

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

// ─── نموذج البيانات ───────────────────────────────────────────────────────────

export type Relation =
  | "deceased"   // المتوفى
  | "spouse"     // زوج / زوجة
  | "son"        // ابن
  | "daughter"   // بنت
  | "father"     // أب
  | "mother"     // أم
  | "brother"    // أخ
  | "sister"     // أخت
  | "grandson"   // حفيد
  | "granddaughter" // حفيدة
  | "uncle"      // عم
  | "nephew"     // ابن أخ
  | "cousin"     // ابن عم
  | "arham";     // ذوو أرحام

export interface FamilyNodeData {
  [key: string]: unknown;
  name: string;
  gender: "male" | "female";
  relation: Relation;
  isAlive: boolean;
  /** حصة من التركة كنسبة (0 → 1)، تُملأ بعد الحساب */
  shareRatio?: number;
  /** المبلغ المحسوب بالعملة المحلية */
  shareAmount?: number;
  /** سبب الحصة أو الحجب */
  shareBasis?: string;
  /** هل محجوب؟ */
  isBlocked?: boolean;
  /** callback عند الضغط على العقدة */
  onSelect?: (id: string) => void;
}

// ─── ثوابت التصميم ────────────────────────────────────────────────────────────

const COLORS = {
  deceased: {
    bg: "#fffdfa", // Elegant warm ivory white
    border: "#f59e0b", // Amber 500
    accent: "#b45309", // Amber 700
    text: "#0f172a", // Slate 900
    sub: "#475569", // Slate 600
    badge: "#fef3c7", // Amber 100
    badgeText: "#78350f", // Amber 900
  },
  male: {
    bg: "#f8fafc", // Cool slate-blue tinted white
    border: "#3b82f6", // Blue 500
    accent: "#1d4ed8", // Blue 700
    text: "#0f172a", // Slate 900
    sub: "#475569", // Slate 600
    badge: "#dbeafe", // Blue 100
    badgeText: "#1e40af", // Blue 800
  },
  female: {
    bg: "#fff5f5", // Soft rose-pink tinted white
    border: "#f43f5e", // Rose 500
    accent: "#b91c1c", // Red 700
    text: "#0f172a", // Slate 900
    sub: "#475569", // Slate 600
    badge: "#ffe4e6", // Rose 100
    badgeText: "#9f1239", // Rose 800
  },
  blocked: {
    bg: "#f1f5f9", // Muted light gray
    border: "#cbd5e1", // Slate 300
    accent: "#64748b", // Slate 500
    text: "#94a3b8", // Slate 400
    sub: "#94a3b8", // Slate 400
    badge: "#e2e8f0", // Slate 200
    badgeText: "#475569", // Slate 600
  },
};

const RELATION_LABELS: Record<Relation, string> = {
  deceased:      "المتوفى",
  spouse:        "زوج / زوجة",
  son:           "ابن",
  daughter:      "بنت",
  father:        "أب",
  mother:        "أم",
  brother:       "أخ",
  sister:        "أخت",
  grandson:      "حفيد",
  granddaughter: "حفيدة",
  uncle:         "عم",
  nephew:        "ابن أخ",
  cousin:        "ابن عم",
  arham:         "ذوو أرحام",
};

// ─── أيقونة الجنس ─────────────────────────────────────────────────────────────

function GenderIcon({ gender, color }: { gender: "male" | "female"; color: string }) {
  if (gender === "male") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="5.5" cy="8.5" r="4" stroke={color} strokeWidth="1.5" />
        <line x1="8.5" y1="5.5" x2="12.5" y2="1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <polyline points="9.5,1.5 12.5,1.5 12.5,4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5.5" r="4" stroke={color} strokeWidth="1.5" />
      <line x1="7" y1="9.5" x2="7" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.5" y1="11.5" x2="9.5" y2="11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── شريط الحصة ───────────────────────────────────────────────────────────────

function ShareBar({ ratio, accent }: { ratio: number; accent: string }) {
  const pct = Math.round(ratio * 100);
  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          height: 3,
          borderRadius: 99,
          background: "rgba(15,23,42,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: accent,
            borderRadius: 99,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div
        style={{
          marginTop: 3,
          fontSize: 10,
          color: accent,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {pct}%
      </div>
    </div>
  );
}

// ─── العقدة الرئيسية ──────────────────────────────────────────────────────────

function FamilyNode({ id, data, selected }: NodeProps<Node<FamilyNodeData>>) {
  const {
    name,
    gender,
    relation,
    isAlive,
    shareRatio,
    shareAmount,
    shareBasis,
    isBlocked,
    onSelect,
  } = data;

  const palette =
    isBlocked
      ? COLORS.blocked
      : relation === "deceased"
      ? COLORS.deceased
      : gender === "male"
      ? COLORS.male
      : COLORS.female;

  const isDead = !isAlive && relation !== "deceased";

  // ─── المتوفى: تصميم خاص أكبر وأبرز ─────────────────────────────────────
  if (relation === "deceased") {
    return (
      <>
        {/* مقبض سفلي للأبناء */}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: palette.accent, border: "none", width: 8, height: 8 }}
        />

        {/* مقبض علوي للآباء/الأجداد */}
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: palette.accent, border: "none", width: 8, height: 8 }}
        />

        <div
          onClick={() => onSelect?.(id)}
          style={{
            width: 160,
            background: palette.bg,
            border: `1.5px solid ${selected ? palette.accent : palette.border}`,
            borderRadius: 14,
            padding: "14px 16px",
            cursor: "pointer",
            boxShadow: selected
              ? `0 0 0 3px ${palette.accent}33, 0 8px 32px ${palette.accent}22`
              : `0 4px 20px rgba(15,23,42,0.06)`,
            transition: "box-shadow 0.2s, border-color 0.2s",
            userSelect: "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* خلفية زخرفية */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse at 50% 0%, ${palette.accent}12 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          {/* شارة */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: palette.badge,
              border: `0.5px solid ${palette.border}`,
              borderRadius: 99,
              padding: "2px 8px",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: palette.accent,
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: palette.badgeText,
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              المتوفى
            </span>
          </div>

          {/* الاسم */}
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: palette.text,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
              marginBottom: 2,
            }}
          >
            {name}
          </div>

          {/* الجنس */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: palette.sub,
              fontSize: 11,
            }}
          >
            <GenderIcon gender={gender} color={palette.sub} />
            <span>{gender === "male" ? "ذكر" : "أنثى"}</span>
          </div>

          {/* التركة */}
          {shareAmount !== undefined && (
            <div
              style={{
                marginTop: 10,
                padding: "6px 10px",
                background: "rgba(15,23,42,0.03)",
                borderRadius: 8,
                border: `0.5px solid ${palette.border}`,
              }}
            >
              <div style={{ fontSize: 10, color: palette.sub, marginBottom: 2 }}>
                التركة الإجمالية
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: palette.accent,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {shareAmount.toLocaleString("en-US")}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ─── باقي الورثة ─────────────────────────────────────────────────────────
  return (
    <>
      {/* مقبض علوي: استقبال الاتصال من الأب */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: palette.accent,
          border: "none",
          width: 6,
          height: 6,
          opacity: 0.7,
        }}
      />

      {/* مقبض سفلي: لأبنائه إن وجدوا */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: palette.accent,
          border: "none",
          width: 6,
          height: 6,
          opacity: 0.7,
        }}
      />

      {/* مقبض يمين/يسار: للزوج */}
      <Handle
        type="target"
        id="spouse-target"
        position={Position.Left}
        style={{
          background: palette.accent,
          border: "none",
          width: 6,
          height: 6,
          top: "50%",
          opacity: 0.5,
        }}
      />
      <Handle
        type="source"
        id="spouse-source"
        position={Position.Right}
        style={{
          background: palette.accent,
          border: "none",
          width: 6,
          height: 6,
          top: "50%",
          opacity: 0.5,
        }}
      />

      <div
        onClick={() => onSelect?.(id)}
        style={{
          width: 140,
          background: isDead ? "#e2e8f0" : palette.bg,
          border: `1px solid ${selected ? palette.accent : palette.border}`,
          borderRadius: 12,
          padding: "10px 12px",
          cursor: "pointer",
          opacity: isDead ? 0.7 : 1,
          boxShadow: selected
            ? `0 0 0 2px ${palette.accent}33, 0 6px 16px rgba(15,23,42,0.12)`
            : "0 2px 10px rgba(15,23,42,0.05)",
          transition: "all 0.2s",
          userSelect: "none",
          position: "relative",
        }}
      >
        {/* علامة متوفى بخط قطري */}
        {isDead && (
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            viewBox="0 0 140 100"
            preserveAspectRatio="none"
          >
            <line x1="8" y1="8" x2="132" y2="92" stroke={palette.border} strokeWidth="1" strokeDasharray="4 3" />
          </svg>
        )}

        {/* رأس البطاقة: أيقونة + علاقة */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <GenderIcon gender={gender} color={palette.accent} />
            <span
              style={{
                fontSize: 9,
                color: palette.sub,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {RELATION_LABELS[relation]}
            </span>
          </div>

          {/* شارة محجوب */}
          {isBlocked && (
            <span
              style={{
                fontSize: 8,
                padding: "2px 6px",
                borderRadius: 4,
                background: "#e2e8f0",
                color: "#64748b",
                border: "0.5px solid #cbd5e1",
              }}
            >
              محجوب
            </span>
          )}
        </div>

        {/* الاسم */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isBlocked ? COLORS.blocked.text : palette.text,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 8,
          }}
        >
          {name}
        </div>

        {/* حصة + مبلغ */}
        {shareRatio !== undefined && !isBlocked ? (
          <>
            <ShareBar ratio={shareRatio} accent={palette.accent} />
            {shareAmount !== undefined && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: palette.accent,
                  fontWeight: 600,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {shareAmount > 0 ? shareAmount.toLocaleString("en-US", { style: 'currency', currency: 'DZD' }) : '-'}
              </div>
            )}
            {shareBasis && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 9,
                  color: palette.sub,
                  lineHeight: 1.4,
                  borderTop: `0.5px solid ${palette.border}`,
                  paddingTop: 4,
                }}
              >
                {shareBasis}
              </div>
            )}
          </>
        ) : !isBlocked ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              color: palette.sub,
              textAlign: "center",
              padding: "3px 0",
              borderTop: `0.5px solid ${palette.border}`,
            }}
          >
            لم تُحسب الحصة بعد
          </div>
        ) : null}
      </div>
    </>
  );
}

export default memo(FamilyNode);
