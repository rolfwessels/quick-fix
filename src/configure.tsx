import { Action, ActionPanel, Form, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { DEFAULT_WRITING_STYLE } from "./writing-style";
import { loadSettings, MODEL_OPTIONS, resetWritingStyle, saveSettings, Settings } from "./settings";

export default function Command() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings().then((value) => {
      setSettings(value);
      setIsLoading(false);
    });
  }, []);

  async function handleSubmit(values: { openaiApiKey: string; model: string; writingStyle: string }) {
    await saveSettings({
      openaiApiKey: values.openaiApiKey,
      model: values.model,
      writingStyle: values.writingStyle,
    });
    setSettings({
      openaiApiKey: values.openaiApiKey.trim(),
      model: values.model,
      writingStyle: values.writingStyle,
    });
    await showToast({ style: Toast.Style.Success, title: "Settings saved" });
  }

  async function handleResetStyle() {
    const writingStyle = await resetWritingStyle();
    setSettings((current) => (current ? { ...current, writingStyle } : current));
    await showToast({ style: Toast.Style.Success, title: "Writing style reset" });
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Settings" onSubmit={handleSubmit} />
          <Action title="Reset Writing Style to Default" onAction={handleResetStyle} />
        </ActionPanel>
      }
    >
      <Form.Description text="API key and model are stored on this Mac only. Requests go straight to OpenAI." />
      <Form.PasswordField
        id="openaiApiKey"
        title="OpenAI API Key"
        placeholder="sk-…"
        value={settings?.openaiApiKey ?? ""}
        onChange={(openaiApiKey) => setSettings((current) => (current ? { ...current, openaiApiKey } : current))}
      />
      <Form.Dropdown
        id="model"
        title="Model"
        value={settings?.model ?? "gpt-6-luna"}
        onChange={(model) => setSettings((current) => (current ? { ...current, model } : current))}
      >
        {MODEL_OPTIONS.map((option) => (
          <Form.Dropdown.Item key={option.value} title={option.title} value={option.value} />
        ))}
      </Form.Dropdown>
      <Form.Separator />
      <Form.TextArea
        id="writingStyle"
        title="Tone of voice"
        info="Applied on every Fix Spelling and Grammar run."
        value={settings?.writingStyle ?? DEFAULT_WRITING_STYLE}
        onChange={(writingStyle) => setSettings((current) => (current ? { ...current, writingStyle } : current))}
      />
      <Form.Description text="Reset Writing Style restores the built-in default. Save Settings keeps API key, model, and tone together." />
    </Form>
  );
}
