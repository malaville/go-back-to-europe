import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { server } from "./msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
