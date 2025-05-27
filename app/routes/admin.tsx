import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { ValidatedForm, useField } from "@rvf/react-router";
// import { ValidatedForm, useField } from "@rvf/remix";
import { validationError } from "@rvf/react-router";
// import { validationError } from "@rvf/remix";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Button,
  Center,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import directus from "libs/directus_sdk";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { createFeedbackValidator } from "libs/validator";

export enum FeedbackIntent {
  Create = "create",
  Delete = "delete",
  UpdateStatus = "update-status",
}


export async function loader({}: LoaderFunctionArgs) {
  const feedbacks = await directus.request(readItems("feedback"));
  return { feedbacks };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as FeedbackIntent;

  if (intent === FeedbackIntent.Create) {
    const validator = createFeedbackValidator();
    const fieldValues = await validator.validate(formData);
    if (fieldValues.error) return validationError(fieldValues.error);

    const { title, description, category } = fieldValues.data;
    await directus.request(
      createItem("feedback", {
        title,
        description,
        category,
        status: "Pending",
      })
    );
    return redirect("/admin");
  }

  if (intent === FeedbackIntent.Delete) {
    const id = formData.get("id") as string;
    await directus.request(deleteItem("feedback", id));
  }

  if (intent === FeedbackIntent.UpdateStatus) {
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;
    const result = await directus.request(
      updateItem("feedback", id, { status })
    );
    console.log(result);
    return redirect("/admin");
  }

  return null;
}

export default function AdminPage() {
  const { feedbacks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const loginValidator = createFeedbackValidator()



  return (
    <Paper radius="md" m="xl" p="lg" withBorder bg="white">
      <Title order={1} mb="md">
        Admin Panel
      </Title>

      <Tabs defaultValue="create">
        <Tabs.List>
          <Tabs.Tab value="create">Create Feedback</Tabs.Tab>
          <Tabs.Tab value="view">View Feedbacks</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="create" pt="md">
          <ValidatedForm
            validator={loginValidator}
            method="post"
            action="/admin"
            encType="application/x-www-form-urlencoded"
            fetcherKey={undefined}
            replace={false}
            state={undefined}
            navigate={true}
            preventScrollReset={false}
            relative="route"
            viewTransition={false}
          >
            {({ formState }) => {
              const titleField = useField("title");
              const descriptionField = useField("description");
              const categoryField = useField("category");

              return (
                <Stack>
                  <input type="hidden" name="intent" value={FeedbackIntent.Create} />
                  <TextInput
                    label="Title"
                    name="title"
                    required
                    {...titleField.getInputProps()}
                    error={titleField.error()}
                  />
                  <Textarea
                    label="Description"
                    name="description"
                    autosize
                    minRows={3}
                    required
                    {...descriptionField.getInputProps()}
                    error={descriptionField.error()}
                  />
                  <Select
                    label="Category"
                    name="category"
                    data={["Bug", "Feature", "Other"]}
                    required
                    // value={categoryField.value}
                    onChange={(value) => categoryField.setValue(value ?? "")}
                    onBlur={categoryField.getInputProps().onBlur}
                    error={categoryField.error()}
                  />
                  <Group justify="flex-end">
                    <Button type="submit" loading={formState.isSubmitting}>
                      Submit
                    </Button>
                  </Group>
                </Stack>
              );
            }}
          </ValidatedForm>
        </Tabs.Panel>

        <Tabs.Panel value="view" pt="md">
          <Title order={3} mb="sm">
            All Feedbacks
          </Title>
          {feedbacks.length > 0 ? (
            <Table
              striped
              highlightOnHover
              withTableBorder
              verticalSpacing="sm"
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>Title</th>
                  <th style={{ textAlign: "center" }}>Category</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb: any) => (
                  <tr key={fb.id}>
                    <td>
                      <Center>
                        <Text size="sm">{fb.title}</Text>
                      </Center>
                    </td>
                    <td>
                      <Center>
                        <Text size="sm">{fb.category}</Text>
                      </Center>
                    </td>
                    <td>
                      <Center>
                        <fetcher.Form method="post" data-feedback-id={fb.id}>
                          <input
                            type="hidden"
                            name="intent"
                            value={FeedbackIntent.UpdateStatus}
                          />
                          <input type="hidden" name="id" value={fb.id} />
                          <Select
                            name="status"
                            size="xs"
                            w={140}
                            defaultValue={fb.status}
                            data={["Pending", "Reviewed"]}
                            onChange={(value) => {
                              const formData = new FormData();
                              formData.append("intent", "update-status");
                              formData.append("id", fb.id);
                              formData.append("status", value || fb.status);
                              fetcher.submit(formData, { method: "post" });
                            }}
                            disabled={
                              fetcher.state === "submitting" &&
                              fetcher.formData?.get("id") === fb.id
                            }
                          />
                        </fetcher.Form>
                      </Center>
                    </td>
                    <td>
                      <Center>
                        <fetcher.Form method="post">
                          <input type="hidden" name="intent" value={FeedbackIntent.Delete} />
                          <input type="hidden" name="id" value={fb.id} />
                          <Button
                            type="submit"
                            variant="light"
                            color="red"
                            size="xs"
                            loading={
                              fetcher.state === "submitting" &&
                              fetcher.formData?.get("id") === fb.id
                            }
                          >
                            Delete
                          </Button>
                        </fetcher.Form>
                      </Center>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Title order={5} c="dimmed" ta="center" mt="md">
              No feedbacks found.
            </Title>
          )}
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
