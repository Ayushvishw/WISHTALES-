"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { playAudio, stopAudio } from "@/experience/audio";
import { track } from "@/lib/analytics";
import { validatePhotoCount, validateValues, type FieldErrors, type Values } from "@/lib/personalization";
import type { TemplateConfig, TemplateField } from "@/lib/templates/schema";

type Photo = { id: string; url: string; thumbUrl: string };
type Music = { id: string; title: string; source: string; license: string };

const SAMPLE: Values = {
  recipient_name: "Riya",
  sender_name: "Aarav",
  relationship: "your best friend since Class 6",
  age: "27",
  message:
    "I tried to write something clever three times. Here is the plain version.\nYou are the person I call first, with good news, bad news, or nothing at all at 1 a.m.\nYou have never once made me feel like too much. Happy birthday.",
  secret_line: "Same time next year: Goa, finally. The tickets are already booked.",
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || "Something went wrong. Please try again.");
  return body as T;
}

export function DraftEditor(props: { draftKey: string; config: TemplateConfig; values: Values; photos: Photo[]; musicId: string | null; music: Music[] }) {
  const { draftKey, config } = props;
  const router = useRouter();
  const [values, setValues] = useState<Values>(props.values);
  const [photos, setPhotos] = useState<Photo[]>(props.photos);
  const [musicId, setMusicId] = useState(props.musicId ?? config.music.default);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [photoMsg, setPhotoMsg] = useState("");
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [listening, setListening] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<Values | null>(null);
  const base = `/api/drafts/${draftKey}`;

  useEffect(() => {
    if (!Object.keys(props.values).length) track("form_started", config.slug);
    return () => stopAudio();
  }, [config.slug, props.values]);

  const save = async () => {
    clearTimeout(timer.current);
    const v = pending.current;
    if (!v) return true;
    pending.current = null;
    setSaving("saving");
    try {
      await api(base, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ values: v }) });
      setSaving("saved");
      return true;
    } catch {
      pending.current = v;
      setSaving("error");
      return false;
    }
  };

  const change = (next: Values) => {
    setValues(next);
    pending.current = next;
    clearTimeout(timer.current);
    timer.current = setTimeout(save, 600);
  };

  const upload = async (files: File[]) => {
    setPhotoMsg("");
    const msgs: string[] = [];
    let count = photos.length;
    for (const f of files) {
      if (count >= config.photos.max) { msgs.push(`This template takes up to ${config.photos.max} photos.`); break; }
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { msgs.push(`${f.name} isn't a JPG, PNG or WebP image.`); continue; }
      if (f.size > 10 * 1024 * 1024) { msgs.push(`${f.name} is over 10 MB.`); continue; }
      setUploading((n) => n + 1);
      try {
        const fd = new FormData();
        fd.append("file", f);
        const p = await api<Photo>(`${base}/photos`, { method: "POST", body: fd });
        setPhotos((ps) => [...ps, p]);
        count++;
      } catch (e) {
        msgs.push(`${f.name}: ${(e as Error).message} You can choose it again to retry.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    setPhotoMsg(msgs.join(" "));
  };

  const useSamplePhotos = async () => {
    const need = config.photos.max - photos.length;
    const files = await Promise.all(
      Array.from({ length: need }, async (_, i) => {
        const blob = await (await fetch(`/samples/${((photos.length + i) % 8) + 1}.webp`)).blob();
        return new File([blob], `sample-${i + 1}.webp`, { type: "image/webp" });
      }),
    );
    await upload(files);
  };

  const remove = async (id: string) => {
    try {
      await api(`${base}/photos/${id}`, { method: "DELETE" });
      setPhotos((ps) => ps.filter((p) => p.id !== id));
    } catch (e) {
      setPhotoMsg((e as Error).message);
    }
  };

  const move = async (k: number, d: number) => {
    const next = [...photos];
    [next[k], next[k + d]] = [next[k + d], next[k]];
    setPhotos(next);
    try {
      await api(`${base}/photos`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: next.map((p) => p.id) }) });
    } catch (e) {
      setPhotos(photos);
      setPhotoMsg((e as Error).message);
    }
  };

  const chooseMusic = async (id: string) => {
    setMusicId(id);
    stopAudio();
    setListening(null);
    await api(base, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ musicId: id }) }).catch(() => {});
  };

  const listen = (m: Music) => {
    if (listening === m.id) { stopAudio(); setListening(null); return; }
    setListening(playAudio(m.source) ? m.id : null);
  };

  const preview = async () => {
    stopAudio();
    const errs = validateValues(config, values);
    const pErr = validatePhotoCount(config, photos.length);
    setErrors(errs);
    setPhotoMsg(pErr ?? "");
    if (Object.keys(errs).length || pErr) {
      document.querySelector<HTMLElement>(".invalid input, .invalid textarea")?.focus();
      return;
    }
    setBusy(true);
    if (!(await save())) { setBusy(false); return; }
    router.push(`/d/${draftKey}/preview`);
  };

  const field = (f: TemplateField) => {
    const id = `f-${f.key}`;
    const e = errors[f.key];
    const common = {
      id,
      value: values[f.key] ?? "",
      placeholder: f.placeholder || f.default || "",
      onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change({ ...values, [f.key]: ev.target.value }),
      "aria-invalid": !!e,
      "aria-describedby": e ? `${id}-err` : undefined,
    };
    return (
      <label key={f.key} htmlFor={id} className={`fl ${f.type === "textarea" || (f.max ?? 0) > 60 ? "wide" : ""} ${e ? "invalid" : ""}`}>
        <span>{f.label} {!f.required && <em>(optional)</em>}</span>
        {f.type === "textarea" ? <textarea {...common} maxLength={f.max} /> : <input {...common} type={f.type} maxLength={f.type === "number" ? undefined : f.max} min={f.min} max={f.type === "number" ? f.max : undefined} />}
        {f.help && <small>{f.help}</small>}
        {e && <span className="err" id={`${id}-err`}>{e}</span>}
      </label>
    );
  };

  const slots = Math.max(config.photos.max, photos.length);
  return (
    <div className="cols">
      <form className="form" onSubmit={(e) => { e.preventDefault(); void preview(); }} noValidate>
        <fieldset>
          <legend>Names and words</legend>
          <div className="f2">{config.fields.map(field)}</div>
          <div className="row">
            <button type="button" className="btn ghost small" onClick={() => change({ ...SAMPLE, event_date: new Date().toISOString().slice(0, 10) })}>Fill with sample details</button>
            <span className="saving" role="status">{{ idle: "", saving: "Saving…", saved: "Saved", error: "Couldn't save. We'll retry when you continue." }[saving]}</span>
          </div>
        </fieldset>

        <fieldset>
          <legend>Photos</legend>
          <div className="drop">
            <div>
              <b>Add {config.photos.min} to {config.photos.max} photos</b>
              <div className="note">JPG, PNG or WebP, up to 10 MB each. They appear in this order.</div>
            </div>
            <div className="row">
              <label className="btn small" htmlFor="file">Choose photos</label>
              <input id="file" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { void upload([...(e.target.files ?? [])]); e.target.value = ""; }} />
              {photos.length < config.photos.max && <button type="button" className="btn ghost small" onClick={useSamplePhotos}>Use sample photos</button>}
            </div>
          </div>
          <div className="photos">
            {Array.from({ length: slots }, (_, k) => {
              const p = photos[k];
              if (!p) return <div key={`e${k}`} className={k < photos.length + uploading ? "ph busy" : "ph empty"}>{k < photos.length + uploading ? "Uploading…" : k < config.photos.min ? "Needed" : "Optional"}</div>;
              return (
                <div className="ph" key={p.id}>
                  <img src={p.thumbUrl} alt={`Photo ${k + 1}`} />
                  <span className="n">{k + 1}</span>
                  <div className="acts">
                    <button type="button" aria-label={`Move photo ${k + 1} earlier`} disabled={k === 0} onClick={() => move(k, -1)}>‹</button>
                    <button type="button" aria-label={`Remove photo ${k + 1}`} onClick={() => remove(p.id)}>✕</button>
                    <button type="button" aria-label={`Move photo ${k + 1} later`} disabled={k === photos.length - 1} onClick={() => move(k, 1)}>›</button>
                  </div>
                </div>
              );
            })}
          </div>
          {photoMsg && <div className="err" role="alert">{photoMsg}</div>}
        </fieldset>

        <fieldset>
          <legend>Music</legend>
          <div className="music">
            {props.music.map((m) => (
              <div className="track" key={m.id}>
                <input type="radio" name="music" id={`m-${m.id}`} checked={musicId === m.id} onChange={() => chooseMusic(m.id)} />
                <label htmlFor={`m-${m.id}`}><b>{m.title}</b><span>{m.license}</span></label>
                {m.source !== "none" && <button type="button" className="btn ghost small" onClick={() => listen(m)}>{listening === m.id ? "Stop" : "Listen"}</button>}
              </div>
            ))}
          </div>
        </fieldset>

        <div className="row">
          <button className="btn accent" type="submit" disabled={busy || uploading > 0}>{uploading ? "Uploading photos…" : "Preview the experience"}</button>
          {Object.keys(errors).length > 0 && <span className="err">Fix {Object.keys(errors).length} thing{Object.keys(errors).length > 1 ? "s" : ""} above to continue.</span>}
        </div>
      </form>

      <aside className="side">
        <div className="panel">
          <div className="eyebrow">Your template</div>
          <h3>{config.name}</h3>
          <p className="note" style={{ margin: 0 }}>{config.description}</p>
        </div>
        <div className="panel">
          <h3>Writing that moves people</h3>
          <ul className="tips">
            <li><b>A moment, not a quality.</b> &quot;You drove two hours to bring me soup&quot; stays longer than &quot;you&apos;re kind&quot;.</li>
            <li><b>Say what it meant to you.</b> The feeling matters more than the event.</li>
            <li><b>Save one surprise.</b> Put it where they have to uncover it.</li>
            <li><b>End short.</b> The last line is what they remember.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
