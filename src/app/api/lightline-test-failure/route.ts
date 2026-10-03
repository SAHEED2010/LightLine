// Temporary protected Preview endpoint for a controlled BimpeAI failure test.
// Remove this route immediately after the test; it must not reach main.
export async function POST(request: Request) {
  if (new URL(request.url).searchParams.get("delay") === "1") {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  return Response.json(
    {
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Test service unavailable.",
      },
    },
    { status: 503 },
  );
}
