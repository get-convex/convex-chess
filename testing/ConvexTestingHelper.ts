import { ConvexClient } from "convex/browser";
import {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
  UserIdentity,
} from "convex/server";
import fs from "fs";
import path from "path";

/**
 * This is a helper for testing Convex functions against a locally running backend.
 *
 * An example of calling a function:
 * ```
 * const t = new ConvexTestingHelper();
 * const result = await t.query(api.foo.bar, { arg1: "baz" })
 * ```
 *
 * An example of calling a function with auth:
 * ```
 * const t = new ConvexTestingHelper();
 * const identityA = t.newIdentity({ name: "Person A"})
 * const result = await t.withIdentity(identityA).query(api.users.getProfile);
 * ```
 */
export class ConvexTestingHelper {
  private _nextSubjectId: number = 0;
  public client: ConvexClient;
  private _adminKey: string;

  constructor(options: { adminKey?: string; backendUrl?: string } = {}) {
    this.client = new ConvexClient(
      options.backendUrl ?? "http://127.0.0.1:8000"
    );
    this._adminKey =
      options.adminKey ??
      fs.readFileSync(path.resolve(__dirname, "admin_key.txt"), "utf-8");
  }

  newIdentity(
    args: Partial<Omit<UserIdentity, "tokenIdentifier">>
  ): Omit<UserIdentity, "tokenIdentifier"> {
    const subject = `test subject ${this._nextSubjectId}`;
    this._nextSubjectId += 1;
    const issuer = "test issuer";
    return {
      ...args,
      subject,
      issuer,
    };
  }

  withIdentity(
    identity: Omit<UserIdentity, "tokenIdentifier">
  ): Pick<ConvexClient, "mutation" | "action" | "query"> {
    return {
      mutation: (functionReference, args) => {
        (this.client as any).setAdminAuth(this._adminKey, identity);
        return this.client.mutation(functionReference, args).finally(() => {
          this.client.client.clearAuth();
        });
      },
      action: (functionReference, args) => {
        (this.client as any).setAdminAuth(this._adminKey, identity);
        return this.client.action(functionReference, args).finally(() => {
          this.client.client.clearAuth();
        });
      },
      query: (functionReference, args) => {
        (this.client as any).setAdminAuth(this._adminKey, identity);
        return this.client.query(functionReference, args).finally(() => {
          this.client.client.clearAuth();
        });
      },
    };
  }

  async mutation<Mutation extends FunctionReference<"mutation">>(
    mutation: Mutation,
    args: FunctionArgs<Mutation>
  ): Promise<Awaited<FunctionReturnType<Mutation>>> {
    return this.client.mutation(mutation, args);
  }

  async query<Query extends FunctionReference<"query">>(
    query: Query,
    args: FunctionArgs<Query>
  ): Promise<Awaited<FunctionReturnType<Query>>> {
    return this.client.query(query, args);
  }

  async action<Action extends FunctionReference<"action">>(
    action: Action,
    args: FunctionArgs<Action>
  ): Promise<Awaited<FunctionReturnType<Action>>> {
    return this.client.action(action, args);
  }

  async close(): Promise<void> {
    return this.client.close();
  }
}
