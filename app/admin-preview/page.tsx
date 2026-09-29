import React from "react";

export default function AdminDesignPreviewPage() {
  const designs = [
    {
      id: 1,
      title: "Concept 1: Executive Sacred Command Center 🪔 (பரிந்துரைப்பது)",
      desc: "கம்பீரமான Dark Emerald & Gold சைட்பார் மெனு, டாப் எக்ஸிகியூட்டிவ் KPI கார்டுகள், விரிவான ரெவென்யூ டிரெண்ட் சார்ட் மற்றும் குயிக் ஆக்ஷன் டேபிள்.",
      src: "/admin_concept_1.jpg",
    },
    {
      id: 2,
      title: "Concept 2: Modern Minimalist Glass Island 🏝️",
      desc: "மேல் பகுதியில் மிதக்கும் Floating Pill Tabs மெனு, பிரகாசமான ஆஃப்-ஒயிட் கிளாஸ் கார்டுகள், டோனட் சார்ட் மற்றும் கிளீன் ஸ்டேட்டஸ் பேட்ஜ்கள்.",
      src: "/admin_concept_2.jpg",
    },
    {
      id: 3,
      title: "Concept 3: Sacred Temple Heritage Royal 🏛️",
      desc: "பாரம்பரிய கோவில் கோபுர சிற்பக் கலைநயத்துடன் கூடிய ராயல் ஹெடர் மெனு, பழமை வாய்ந்த ஐவரி-தங்கப் பின்னணி மற்றும் ஆன்மீக நிதி லெட்ஜர்.",
      src: "/admin_concept_3.jpg",
    },
    {
      id: 4,
      title: "Concept 4: Sacred Dark Mode Cyber-Temple ⚡",
      desc: "டீப் ஆப்ஸிடியன் டார்க் மோட், ஒளிரும் தங்க நிற & எமரால்டு குறியீடுகள், ரியல்-டைம் கிளவுட் லேட்டன்சி மீட்டர் மற்றும் ஹை-டெக் கண்ட்ரோல் கன்சோல்.",
      src: "/admin_concept_4.jpg",
    },
    {
      id: 5,
      title: "Concept 5: Floating Bento Grid Dashboard 🍱",
      desc: "ஜப்பானிய பென்டோ பாக்ஸ் போன்ற நேர்த்தியான மாடுலர் கார்டுகள், இன்ஸ்டன்ட் வேலிடிட்டி ஸ்லைடர் மற்றும் மினிமல் கூப்பன் கோட் என்ஜின்.",
      src: "/admin_concept_5.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 border-b border-amber-200/80 pb-6">
          <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            Super Admin UI Redesign
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Super Admin பக்கத்திற்கான 5 புதிய டிசைன் விருப்பங்கள்
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            ஒவ்வொரு டிசைனின் முழுமையான தோற்றமும் கீழே பெரிய அளவில் கொடுக்கப்பட்டுள்ளது. இதில் உங்களுக்குப் பிடித்ததை தேர்வு செய்யுங்கள்.
          </p>
        </div>

        <div className="space-y-12">
          {designs.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-amber-200/80 shadow-xl space-y-4 transition hover:border-amber-400"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {d.title}
                </h2>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                  Option #{d.id}
                </span>
              </div>
              <p className="text-sm text-slate-600 font-medium">{d.desc}</p>
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-inner bg-slate-50">
                <img
                  src={d.src}
                  alt={d.title}
                  className="w-full h-auto object-cover hover:scale-[1.01] transition-transform duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
