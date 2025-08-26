const API = window.location.origin;

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

async function postJSON(path, payload) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || ("HTTP " + res.status));
  }
  return res.json();
}

async function loadFiles() {
  const select = document.getElementById("file_select");
  select.innerHTML = "";
  try {
    const files = await getJSON("/api/files");
    if (!files.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No .docx files found";
      select.appendChild(opt);
      select.disabled = true;
      return;
    }
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- select a file --";
    select.appendChild(placeholder);

    files.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f;
      opt.textContent = f;
      select.appendChild(opt);
    });
  } catch (e) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Error loading files";
    select.appendChild(opt);
    select.disabled = true;
  }
}

document.addEventListener("DOMContentLoaded", loadFiles);

document.getElementById("qform").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const file_name = document.getElementById("file_select").value;
  const scenario = form.scenario.value.trim();
  const cefr_level = form.cefr_level.value.trim();
  const out = document.getElementById("qresult");
  out.textContent = "Generating...";
  try {
    const data = await postJSON("/generate_questions", {
      file_path: file_name,
      scenario,
      cefr_level,
      existing_questions: []
    });
    out.textContent = (data.new_questions || []).map((q, i) => `${i + 1}. ${q}`).join("\n");
  } catch (err) {
    out.textContent = "Error: " + err.message;
  }
});

document.getElementById("eform").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const scenario = form.scenario.value.trim();
  const scenario_question = form.scenario_question.value.trim();
  const cefr_level = form.cefr_level.value.trim();
  const email_content = form.email_content.value.trim();
  const out = document.getElementById("eresult");
  out.textContent = "Evaluating...";
  try {
    const data = await postJSON("/evaluate_email", {
      scenario,
      scenario_question,
      cefr_level,
      email_content
    });
    out.textContent = `Feedback:\n${data.feedback}\n\nRating: ${data.rating}\n\nFormat Check:\n` + JSON.stringify(data.format_evaluation, null, 2);
  } catch (err) {
    out.textContent = "Error: " + err.message;
  }
});
