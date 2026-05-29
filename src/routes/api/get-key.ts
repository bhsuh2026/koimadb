import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/get-key')({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY
        return Response.json({ supabase_service_role_key: key ?? null })
      }
    }
  }
})
