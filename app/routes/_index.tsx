// app/routes/login.tsx
import { Box, Button, Flex, PasswordInput, TextInput } from "@mantine/core";
import { Form, useActionData, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import directus from "libs/directus_sdk";
import { readMe, readRole } from "@directus/sdk";
import { userIdCookie } from "~/cookies";
export async function action({ request }: any) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    const loginResponse = await directus.login(email, password);
    const accessToken = loginResponse.access_token;
    if (!accessToken) {
      throw new Error("Login failed: No access token received");
    }
    const user = await directus.request(readMe());
    const userId = user.id;
    const role = user.role;
    const setCookieHeader = await userIdCookie.serialize(userId);

    const result = await directus.request(readRole(role));
    if (result.name === "feedback_admin") {
      return redirect("/admin", {
        headers: {
          "Set-Cookie": setCookieHeader,
        },
      });
    } else if (result.name === "feedback_members") {
      return redirect("/member", {
        headers: {
          "Set-Cookie": setCookieHeader,
        },
      });
    } else {
      return json({ error: "Unauthorized role" }, { status: 403 });
    }
  } catch (error) {
    console.error("Login failed:", error);
    return json({ error: "Invalid email or password" }, { status: 401 });
  }
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = () => {
    setLoading(true);
  };

  return (
    <Box h="100vh" p="md">
      <Flex justify="center" mt={200} align="center" m="auto">
        <Box w={350}>
          <Form method="post" onSubmit={handleSubmit}>
            <TextInput
              label="Email"
              name="email"
              mb="md"
              required
              placeholder="you@example.com"
            />

            <PasswordInput label="Password" name="password" mb="xl" required />

            <Button type="submit" fullWidth loading={loading}>
              Login
            </Button>
          </Form>
        </Box>
      </Flex>
    </Box>
  );
}
