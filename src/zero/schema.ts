import {
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

type JWTData = { sub: string };

export const permissions = definePermissions<JWTData, Schema>(schema, () => {
  const allowIfSameUser = (
    authData: JWTData,
    eb: ExpressionBuilder<Schema, "users">,
  ) => eb.cmp("id", authData.sub);

  const allowIfOwner = (
    authData: JWTData,
    eb: ExpressionBuilder<Schema, "chats">,
  ) => eb.cmp("userId", authData.sub);

  type Config = CompletePermissionsConfig[keyof CompletePermissionsConfig];

  const SAME_USER_CAN_DO_ANYTHING: Config = {
    row: {
      select: [allowIfSameUser],
      delete: [allowIfSameUser],
      insert: [allowIfSameUser],
      update: {
        preMutation: [allowIfSameUser],
        postMutation: [allowIfSameUser],
      },
    },
  };

  const OWNER_CAN_DO_ANYTHING: Config = {
    row: {
      select: [allowIfOwner],
      delete: [allowIfOwner],
      insert: [allowIfOwner],
      update: {
        preMutation: [allowIfOwner],
        postMutation: [allowIfOwner],
      },
    },
  };

  return {
    users: SAME_USER_CAN_DO_ANYTHING,
    chats: OWNER_CAN_DO_ANYTHING,
    messages: OWNER_CAN_DO_ANYTHING,
    chatTrees: OWNER_CAN_DO_ANYTHING,
  } satisfies CompletePermissionsConfig;
});

type CompletePermissionsConfig = PermissionsConfig<JWTData, Schema> &
  Record<keyof typeof schema.tables, unknown>;
