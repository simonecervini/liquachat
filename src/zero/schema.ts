import {
  ANYONE_CAN_DO_ANYTHING,
  definePermissions,
  type ExpressionBuilder,
  type PermissionsConfig,
  type Row,
} from "@rocicorp/zero";

import { schema, type Schema } from "./schema.gen";

export { schema, type Schema };

export type ZeroRow<TTable extends keyof Schema["tables"]> = Row<
  Schema["tables"][TTable]
>;

export type AuthData = {
  sub: string;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const _allowIfSameUser = (
    authData: AuthData,
    eb: ExpressionBuilder<Schema, "users">,
  ) => eb.cmp("id", authData.sub);

  // TODO: Add permissions

  return {
    users: ANYONE_CAN_DO_ANYTHING,
    // users: {
    //   row: {
    //     select: [allowIfSameUser],
    //     delete: [allowIfSameUser],
    //     insert: [allowIfSameUser],
    //     update: {
    //       preMutation: [allowIfSameUser],
    //       postMutation: [allowIfSameUser],
    //     },
    //   },
    // },
    chats: ANYONE_CAN_DO_ANYTHING,
    messages: ANYONE_CAN_DO_ANYTHING,
  } satisfies CompletePermissionsConfig;
});

type CompletePermissionsConfig = PermissionsConfig<AuthData, Schema> &
  Record<keyof typeof schema.tables, unknown>;
