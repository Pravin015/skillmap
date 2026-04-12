export async function submitForm(type: string, formData: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  const name = (formData.name as string) || (formData.contactPerson as string) || (formData.organisationName as string) || "Unknown";
  const email = (formData.email as string) || (formData.officialEmail as string) || "";
  const phone = (formData.phone as string) || "";

  try {
    const res = await fetch("/api/forms/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name, email, phone, data: formData }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Failed to submit. Please try again." };
  }
}
