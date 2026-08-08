import type { PluginContext } from '../types.ts'

/**
 * `PluginContext` widened with the optional `sessionEnv` field.
 *
 * The pinned `@opencode-ai/plugin` types predate that field, so widening the
 * real context here is what lets one build run against harnesses that have it
 * and harnesses that do not.
 */
type SessionEnvCapableContext = PluginContext & {
  sessionEnv?: (input: { sessionID: string; cwd?: string }) => Promise<Record<string, string>>
}

let resolveSessionEnv: ((sessionID: string) => Promise<Record<string, string>>) | undefined

/**
 * Capture the harness's session-environment resolver, if it has one.
 *
 * Read defensively: an OpenCode without `sessionEnv` cannot say what a
 * session's children should inherit, and those spawns keep the environment
 * they had before.
 */
export function initSessionEnv(context: PluginContext): void {
  const harness: SessionEnvCapableContext = context
  const sessionEnv = harness.sessionEnv
  resolveSessionEnv = sessionEnv
    ? (sessionID: string) => sessionEnv({ sessionID, cwd: context.directory })
    : undefined
}

/**
 * The environment this session's child processes should receive.
 *
 * A PTY is a session-owned child process, but an inherited process environment
 * belongs to the server and names no session, so session-scoped credential
 * helpers cannot resolve their scope inside one.
 */
export async function sessionEnvFor(sessionID: string): Promise<Record<string, string>> {
  if (!resolveSessionEnv) {
    return {}
  }
  return await resolveSessionEnv(sessionID)
}
