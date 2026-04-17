import fs from "node:fs/promises";
import { db } from "./prisma";
import { any, string } from "zod";

export async function createUser(user: {
  name: string;
  username: string;
  email: string;
}) {
  const users = await import("./data/users.json", {
    with: { type: "json" },
  }).then((m) => m.default);

  const id = users.length + 1;

  users.push({ id, ...user });

  await fs.writeFile("./data/users.json", JSON.stringify(users, null, 2));
  return id;
}

export async function createTask(task: { title: string; description: string }) {
  const newTask = await db.task.create({
    data: {
      title: task.title,
      description: task.description,
    },
  });
  return newTask.id;
}

export async function updateTask(task: { title: string; description: string }) {
  const updateTask = await db.task.updateMany({
    where: { id : "1b021af5-2693-418d-8a15-39db9bdd0f29" },
    data : { title : task.title , description : task.description }
  });
  return updateTask.count;
}
