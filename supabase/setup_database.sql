
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Trigger: on signup, create profile; first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- FAQS
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question_en TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  question_te TEXT,
  answer_te TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read faqs" ON public.faqs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage faqs" ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- COURSES
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  duration TEXT,
  eligibility TEXT,
  fees TEXT,
  description TEXT,
  seats INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read courses" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- HOSTEL
CREATE TABLE public.hostel_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  fees TEXT,
  facilities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hostel_info TO anon, authenticated;
GRANT ALL ON public.hostel_info TO service_role;
ALTER TABLE public.hostel_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read hostel" ON public.hostel_info FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage hostel" ON public.hostel_info FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_hostel_updated BEFORE UPDATE ON public.hostel_info FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CONTACT
CREATE TABLE public.contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contact_info TO anon, authenticated;
GRANT ALL ON public.contact_info TO service_role;
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read contact" ON public.contact_info FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage contact" ON public.contact_info FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_contact_updated BEFORE UPDATE ON public.contact_info FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- DOCUMENTS
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.documents TO anon, authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read documents" ON public.documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage documents" ON public.documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CHAT
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO anon, authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or session access conversations" ON public.chat_conversations FOR ALL TO anon, authenticated
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND session_id IS NOT NULL)
  )
  WITH CHECK (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access messages via conversation" ON public.chat_messages FOR ALL TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = conversation_id
      AND ((c.user_id IS NOT NULL AND auth.uid() = c.user_id) OR c.user_id IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = conversation_id
      AND ((c.user_id IS NOT NULL AND auth.uid() = c.user_id) OR c.user_id IS NULL)
    )
  );

-- SEED DATA
INSERT INTO public.courses (name, code, duration, eligibility, fees, description, seats) VALUES
('B.Tech Computer Science Engineering', 'CSE', '4 years', '10+2 with PCM, 60% min', '₹85,000/year', 'AI, ML, Data Science and software engineering specializations.', 120),
('B.Tech Electronics & Communication', 'ECE', '4 years', '10+2 with PCM, 60% min', '₹80,000/year', 'VLSI, embedded systems, and communication networks.', 60),
('B.Tech Mechanical Engineering', 'MECH', '4 years', '10+2 with PCM, 60% min', '₹75,000/year', 'Design, manufacturing, and thermal engineering.', 60),
('B.Tech Civil Engineering', 'CIVIL', '4 years', '10+2 with PCM, 60% min', '₹75,000/year', 'Structural, transportation, and environmental engineering.', 60),
('MBA', 'MBA', '2 years', 'Graduation 50% + ICET/CAT', '₹95,000/year', 'Specializations in Finance, Marketing, HR, and Analytics.', 60);

INSERT INTO public.hostel_info (title, description, fees, facilities) VALUES
('Boys Hostel', 'Spacious boys hostel with 24x7 security and Wi-Fi.', '₹65,000/year (with mess)', 'AC/Non-AC rooms, gym, reading hall, laundry, hot water, RO water'),
('Girls Hostel', 'Safe and well-maintained girls hostel inside campus.', '₹70,000/year (with mess)', 'AC/Non-AC rooms, recreation room, study hall, 24x7 wardens, CCTV');

INSERT INTO public.contact_info (label, value, type) VALUES
('Address', 'NECN College, Main Road, Hyderabad, Telangana - 500001', 'address'),
('Admissions Office', '+91-9876543210', 'phone'),
('Principal Office', '+91-9876543211', 'phone'),
('Email', 'admissions@necn.edu.in', 'email'),
('Website', 'www.necn.edu.in', 'website'),
('Office Hours', 'Mon-Sat, 9:00 AM - 5:00 PM', 'hours');

INSERT INTO public.faqs (category, question_en, answer_en, question_te, answer_te) VALUES
('Admissions', 'How do I apply for admission?', 'Visit the admissions office or apply online at www.necn.edu.in. You need 10+2 marks card, ID proof, and entrance exam scores (EAMCET/JEE).', 'అడ్మిషన్ కోసం ఎలా దరఖాస్తు చేయాలి?', 'www.necn.edu.in లో ఆన్‌లైన్‌లో దరఖాస్తు చేయండి లేదా అడ్మిషన్స్ కార్యాలయాన్ని సందర్శించండి. 10+2 మార్క్‌ల కార్డ్, ID ప్రూఫ్, EAMCET/JEE స్కోర్‌లు అవసరం.'),
('Fees', 'What is the fee structure?', 'Fees vary by course: B.Tech ₹75,000-85,000/year, MBA ₹95,000/year. Hostel and mess are separate. Scholarships available for merit and reservation categories.', 'ఫీజు విధానం ఏమిటి?', 'కోర్సును బట్టి ఫీజు మారుతుంది: B.Tech ₹75,000-85,000/సం, MBA ₹95,000/సం. హాస్టల్ మరియు మెస్ వేరుగా ఉంటాయి.'),
('Placements', 'What are the placement statistics?', 'Last year 85% placement with top recruiters like TCS, Infosys, Wipro, Accenture. Highest package ₹24 LPA, average ₹5.5 LPA.', 'ప్లేస్‌మెంట్ గణాంకాలు ఏమిటి?', 'గత సంవత్సరం 85% ప్లేస్‌మెంట్. TCS, Infosys, Wipro, Accenture వంటి టాప్ రిక్రూటర్‌లు. అత్యధికం ₹24 LPA, సగటు ₹5.5 LPA.'),
('Transport', 'Is bus transport available?', 'Yes, college buses cover 30+ routes across the city. Annual transport fee ₹15,000.', 'బస్ సౌకర్యం ఉందా?', 'అవును, నగరం అంతటా 30+ రూట్‌లలో కాలేజీ బస్‌లు తిరుగుతాయి. వార్షిక రవాణా ఫీజు ₹15,000.'),
('Scholarships', 'What scholarships are available?', 'Merit scholarships up to 50% for top scorers. SC/ST/OBC government scholarships. Sports and need-based scholarships also available.', 'ఏ స్కాలర్‌షిప్‌లు అందుబాటులో ఉన్నాయి?', 'టాప్ స్కోరర్‌లకు 50% వరకు మెరిట్ స్కాలర్‌షిప్‌లు. SC/ST/OBC ప్రభుత్వ స్కాలర్‌షిప్‌లు, స్పోర్ట్స్, అవసర-ఆధారిత స్కాలర్‌షిప్‌లు అందుబాటులో ఉన్నాయి.'),
('Library', 'What are the library facilities?', 'Central library with 50,000+ books, e-journals, digital library access, and 200-seat reading hall. Open 8 AM - 9 PM.', 'లైబ్రరీ సౌకర్యాలు ఏమిటి?', 'సెంట్రల్ లైబ్రరీలో 50,000+ పుస్తకాలు, ఇ-జర్నల్స్, డిజిటల్ లైబ్రరీ యాక్సెస్, 200-సీట్ రీడింగ్ హాల్. ఉదయం 8 - రాత్రి 9 వరకు.'),
('Laboratories', 'What labs are available?', 'Modern labs for all departments: CS (AI/ML, networking, IoT), ECE (VLSI, communication), Mech (CAD/CAM, thermal), Civil (structures, geotech).', 'ఏ ల్యాబ్‌లు అందుబాటులో ఉన్నాయి?', 'అన్ని శాఖలకు ఆధునిక ల్యాబ్‌లు: CS (AI/ML, నెట్‌వర్కింగ్, IoT), ECE (VLSI), Mech (CAD/CAM), Civil (నిర్మాణాలు).'),
('Hostel', 'Is hostel mandatory?', 'No, hostel is optional. Separate boys and girls hostels available with mess facilities.', 'హాస్టల్ తప్పనిసరా?', 'లేదు, హాస్టల్ ఐచ్ఛికం. మెస్ సౌకర్యాలతో అబ్బాయిలు, అమ్మాయిల హాస్టళ్లు అందుబాటులో ఉన్నాయి.');

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage policies for documents bucket
CREATE POLICY "Anyone read documents bucket" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'documents');
CREATE POLICY "Admins upload documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update documents" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;UPDATE public.contact_info SET value = 'Narayana Engineering College, Muthukur Road, Nellore, Andhra Pradesh - 524003' WHERE type = 'address';
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
