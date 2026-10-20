import { Action, ActionPanel, Form, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { BACKENDS, getBackend } from "./backends";
import { BackendId } from "./backends/types";
import { loadSettings, resetWritingStyle, saveSettings, Settings } from "./settings";
import { DEFAULT_WRITING_STYLE } from "./writing-style";

export default function Command() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const backend = getBackend(settings?.backend);
  const current = settings?.backends[backend.id];

  function update(patch: Partial<Settings>) {
    setSettings((value) => (value ? { ...value, ...patch } : value));
  }

  function updateBackend(patch: Partial<{ apiKey: string; model: string }>) {
    setSettings((value) =>
      value
        ? { ...value, backends: { ...value.backends, [backend.id]: { ...value.backends[backend.id], ...patch } } }
        : value,
    );
  }

  async function handleSave() {
    if (!settings) return;
    await saveSettings(settings);
    await showToast({ style: Toast.Style.Success, title: "Settings saved" });
  }

  async function handleResetStyle() {
    const writingStyle = await resetWritingStyle();
    update({ writingStyle });
    await showToast({ style: Toast.Style.Success, title: "Writing style reset" });
  }

  return (
    <Form
      isLoading={!settings}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Settings" onSubmit={handleSave} />
          <Action title="Reset Writing Style to Default" onAction={handleResetStyle} />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="backend"
        title="Backend"
        value={backend.id}
        onChange={(id) => update({ backend: id as BackendId })}
      >
        {BACKENDS.map((b) => (
          <Form.Dropdown.Item key={b.id} title={b.title} value={b.id} />
        ))}
      </Form.Dropdown>
      <Form.Description text={`API key and model are stored on this Mac only. ${backend.privacyNote}`} />
      <Form.PasswordField
        id={`${backend.id}ApiKey`}
        title={backend.keyLabel}
        placeholder={backend.keyPlaceholder}
        value={current?.apiKey ?? ""}
        onChange={(apiKey) => updateBackend({ apiKey })}
      />
      <Form.Dropdown
        id={`${backend.id}Model`}
        title="Model"
        value={current?.model ?? backend.defaultModel}
        onChange={(model) => updateBackend({ model })}
      >
        {backend.models.map((option) => (
          <Form.Dropdown.Item key={option.value} title={option.title} value={option.value} />
        ))}
      </Form.Dropdown>
      <Form.Separator />
      <Form.TextArea
        id="writingStyle"
        title="Tone of voice"
        info="Applied on every Fix Spelling and Grammar run."
        value={settings?.writingStyle ?? DEFAULT_WRITING_STYLE}
        onChange={(writingStyle) => update({ writingStyle })}
      />
      <Form.Description text="Reset Writing Style restores the built-in default. Save Settings keeps the backend, both keys, models and tone together." />
    </Form>
  );
}
