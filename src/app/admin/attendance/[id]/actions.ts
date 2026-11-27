"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markAttendance(formData: FormData) {
  const supabase = await createClient();

  // 1. Verify authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Verify Admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "ADMIN") {
    redirect("/login");
  }

  // 3. Get form values
  const sessionId = formData.get("session_id") as string;
  const volunteerId = formData.get("volunteer_id") as string;
  const attendanceStatus = formData.get("attendance_status") as string;

  // 4. Validate fields
  if (!sessionId || !volunteerId) {
    redirect(`/admin/attendance/${sessionId}?error=missing_fields`);
  }

  if (!["PRESENT", "ABSENT"].includes(attendanceStatus)) {
    redirect(`/admin/attendance/${sessionId}?error=invalid_status`);
  }

  // 5. Check session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, status")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    redirect("/admin/attendance?error=session_not_found");
  }

  if (session.status !== "SCHEDULED") {
    redirect(`/admin/attendance/${sessionId}?error=session_not_scheduled`);
  }

  // 6. Check existing attendance
  const { data: existingAttendance, error: existingError } =
    await supabase
      .from("attendance")
      .select("id")
      .eq("session_id", sessionId)
      .eq("volunteer_id", volunteerId)
      .maybeSingle();

  if (existingError) {
    redirect(`/admin/attendance/${sessionId}?error=attendance_check_failed`);
  }

  // 7. Insert or update attendance
  let saveError;

  if (existingAttendance) {
    const { error } = await supabase
      .from("attendance")
      .update({
        status: attendanceStatus,
        source: "MANUAL",
        marked_by: user.id,
      })
      .eq("id", existingAttendance.id);

    saveError = error;
  } else {
    const { error } = await supabase
      .from("attendance")
      .insert({
        volunteer_id: volunteerId,
        session_id: sessionId,
        status: attendanceStatus,
        source: "MANUAL",
        marked_by: user.id,
      });

    saveError = error;
  }

  if (saveError) {
    console.error("Attendance save error:", saveError);
    redirect(`/admin/attendance/${sessionId}?error=attendance_save_failed`);
  }

  // 8. Refresh page
  revalidatePath(`/admin/attendance/${sessionId}`);

  redirect(`/admin/attendance/${sessionId}?saved=true`);
}