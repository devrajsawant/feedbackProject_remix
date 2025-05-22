"use client";
import { useState, useEffect } from "react";
import {
  Button,
  TextInput,
  Textarea,
  Select,
  Group,
  Paper,
  Table,
  Title,
  Notification,
  Divider,
  Flex,
} from "@mantine/core";
import { createItem, readItems } from "@directus/sdk";
import directus from "libs/directus_sdk";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { userIdCookie } from "~/cookies";

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const userId = await userIdCookie.parse(cookieHeader);

  const feedbacks = await directus.request(
    readItems("feedback", {
      filter: {
        created_by: {
          _eq: userId,
        },
      },
    })
  );
  return { feedbacks };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;

  await directus.request(
    createItem("feedback", {
      title,
      description,
      category,
      status: "Pending",
    })
  );

  return redirect("/member");
}

export default function MemberDashboard() {
  const { feedbacks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <Paper radius="md" m={50} p={20} withBorder bg="white">
     

      <Title order={1} c="red">
        Submit Feedback
      </Title>

      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="create" />
        <TextInput label="Title" name="title" required mb="sm" />
        <Textarea
          label="Description"
          name="description"
          autosize
          minRows={3}
          required
          mb="sm"
        />
        <Select
          label="Category"
          name="category"
          data={["Bug", "Feature", "Other"]}
          required
          mb="sm"
        />
        <Group justify="flex-end">
          <Button
            type="submit"
            loading={
              fetcher.state === "submitting" &&
              fetcher.formData?.get("intent") === "create"
            }
          >
            Submit
          </Button>
        </Group>
      </fetcher.Form>

      <Divider color="dark.4" my="md" />

      <Title order={2}>All Feedbacks</Title>

      {feedbacks.length > 0 ? (
        <Table highlightOnHover striped withTableBorder verticalSpacing="sm">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((fb: any) => {
              const statusFetcher = useFetcher();
              return (
                <tr key={fb.id}>
                  <td>{fb.title}</td>
                  <td>{fb.category}</td>
                  <td>
                    <statusFetcher.Form method="post">
                      <input
                        type="hidden"
                        name="intent"
                        value="update-status"
                      />
                      <input type="hidden" name="id" value={fb.id} />
                      <Select
                        name="status"
                        defaultValue={fb.status}
                        data={["Pending", "Reviewed"]}
                        disabled={statusFetcher.state === "submitting"}
                        onChange={(value) => {
                          if (value) {
                            statusFetcher.submit(
                              {
                                intent: "update-status",
                                id: fb.id,
                                status: value,
                              },
                              { method: "post" }
                            );
                          }
                        }}
                      />
                    </statusFetcher.Form>
                  </td>
                  <td>
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={fb.id} />
                      <Button
                        type="submit"
                        variant="light"
                        color="red"
                        loading={
                          fetcher.state === "submitting" &&
                          fetcher.formData?.get("id") === fb.id
                        }
                      >
                        Delete
                      </Button>
                    </fetcher.Form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <div style={{ textAlign: "center", color: "dimmed" }}>
          No feedbacks found.
        </div>
      )}
    </Paper>
  );
}
