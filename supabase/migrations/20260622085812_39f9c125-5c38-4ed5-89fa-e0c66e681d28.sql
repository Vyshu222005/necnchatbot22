
-- 1) Fix chat_conversations / chat_messages session bypass
DROP POLICY IF EXISTS "Owner or session access conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Access messages via conversation" ON public.chat_messages;

CREATE POLICY "Owners read own conversations"
  ON public.chat_conversations
  FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Owners modify own conversations"
  ON public.chat_conversations
  FOR ALL
  TO authenticated
  USING (user_id IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Owners read own messages"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id IS NOT NULL
      AND auth.uid() = c.user_id
  ));

CREATE POLICY "Owners modify own messages"
  ON public.chat_messages
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id IS NOT NULL
      AND auth.uid() = c.user_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id IS NOT NULL
      AND auth.uid() = c.user_id
  ));

-- 2) Switch has_role to SECURITY INVOKER (callers can only read their own user_roles via RLS,
--    which is exactly how has_role is used: has_role(auth.uid(), ...))
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
