--
-- PostgreSQL database dump
--

\restrict 8aW281SunkSMbIDAIIGlge5Sjm7I2KaNhg6pfPsJZGUl9CvwvghDgQaOapO7Rij

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    verification_code character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.email_verifications OWNER TO postgres;

--
-- Name: email_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_verifications_id_seq OWNER TO postgres;

--
-- Name: email_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_verifications_id_seq OWNED BY public.email_verifications.id;


--
-- Name: follows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.follows (
    id integer NOT NULL,
    follower_id integer NOT NULL,
    following_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.follows OWNER TO postgres;

--
-- Name: follows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.follows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.follows_id_seq OWNER TO postgres;

--
-- Name: follows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.follows_id_seq OWNED BY public.follows.id;


--
-- Name: match_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_conversations (
    id integer NOT NULL,
    user1_id integer NOT NULL,
    user2_id integer NOT NULL,
    place_id integer,
    place_name character varying,
    user1_revealed boolean,
    user2_revealed boolean,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    last_message_at timestamp with time zone
);


ALTER TABLE public.match_conversations OWNER TO postgres;

--
-- Name: match_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_conversations_id_seq OWNER TO postgres;

--
-- Name: match_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_conversations_id_seq OWNED BY public.match_conversations.id;


--
-- Name: match_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_likes (
    id integer NOT NULL,
    from_user_id integer NOT NULL,
    to_user_id integer NOT NULL,
    place_id integer,
    action character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.match_likes OWNER TO postgres;

--
-- Name: match_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_likes_id_seq OWNER TO postgres;

--
-- Name: match_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_likes_id_seq OWNED BY public.match_likes.id;


--
-- Name: match_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    display_name character varying NOT NULL,
    age integer NOT NULL,
    bio text,
    photo_urls text,
    height integer,
    gender character varying,
    education character varying,
    location_text character varying,
    smoking character varying,
    drinking character varying,
    looking_for character varying,
    interests text,
    star_sign character varying,
    family_plans character varying,
    exercise character varying,
    prompts text,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.match_profiles OWNER TO postgres;

--
-- Name: match_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_profiles_id_seq OWNER TO postgres;

--
-- Name: match_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_profiles_id_seq OWNED BY public.match_profiles.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    message_type character varying,
    media_url character varying,
    shared_post_id integer,
    is_read boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying NOT NULL,
    actor_id integer,
    post_id integer,
    is_read boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    reset_code character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.places (
    id integer NOT NULL,
    name character varying,
    address character varying,
    city character varying,
    description text,
    vector_id character varying,
    price_range integer,
    category character varying,
    features text,
    latitude double precision,
    longitude double precision,
    average_rating double precision,
    photo_url character varying,
    video_url character varying,
    campaign_text character varying,
    opening_time character varying,
    closing_time character varying
);


ALTER TABLE public.places OWNER TO postgres;

--
-- Name: places_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.places_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.places_id_seq OWNER TO postgres;

--
-- Name: places_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.places_id_seq OWNED BY public.places.id;


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_comments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    parent_id integer,
    text text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.post_comments OWNER TO postgres;

--
-- Name: post_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_comments_id_seq OWNER TO postgres;

--
-- Name: post_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_comments_id_seq OWNED BY public.post_comments.id;


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_likes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.post_likes OWNER TO postgres;

--
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_likes_id_seq OWNER TO postgres;

--
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_likes_id_seq OWNED BY public.post_likes.id;


--
-- Name: post_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_media (
    id integer NOT NULL,
    post_id integer,
    media_type character varying,
    media_url character varying NOT NULL,
    thumbnail_url character varying,
    duration_seconds integer,
    aspect_ratio double precision,
    width integer,
    height integer,
    order_index integer
);


ALTER TABLE public.post_media OWNER TO postgres;

--
-- Name: post_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_media_id_seq OWNER TO postgres;

--
-- Name: post_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_media_id_seq OWNED BY public.post_media.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    place_id integer,
    caption text,
    post_type character varying,
    like_count integer,
    comment_count integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    reporter_id integer NOT NULL,
    target_type character varying NOT NULL,
    target_id integer NOT NULL,
    reason character varying NOT NULL,
    description text,
    status character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: review_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_media (
    id integer NOT NULL,
    review_id integer,
    media_type character varying,
    media_url character varying NOT NULL,
    thumbnail_url character varying,
    width integer,
    height integer,
    file_size integer,
    duration_seconds integer,
    order_index integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.review_media OWNER TO postgres;

--
-- Name: review_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.review_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_media_id_seq OWNER TO postgres;

--
-- Name: review_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.review_media_id_seq OWNED BY public.review_media.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    user_id integer,
    place_id integer,
    comment_text text,
    rating integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    is_verified boolean,
    verify_method character varying,
    verified_at timestamp with time zone,
    distance_meters integer,
    visit_date timestamp with time zone,
    visit_type character varying,
    spent_amount double precision,
    spent_currency character varying,
    wait_time_minutes integer,
    ordered_items text,
    food_rating integer,
    service_rating integer,
    atmosphere_rating integer,
    value_rating integer,
    cleanliness_rating integer,
    helpful_count integer,
    report_count integer,
    owner_response text,
    owner_response_at timestamp with time zone
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: saved_places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_places (
    id integer NOT NULL,
    user_id integer NOT NULL,
    place_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.saved_places OWNER TO postgres;

--
-- Name: saved_places_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saved_places_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saved_places_id_seq OWNER TO postgres;

--
-- Name: saved_places_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saved_places_id_seq OWNED BY public.saved_places.id;


--
-- Name: saved_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.saved_posts OWNER TO postgres;

--
-- Name: saved_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saved_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saved_posts_id_seq OWNER TO postgres;

--
-- Name: saved_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saved_posts_id_seq OWNED BY public.saved_posts.id;


--
-- Name: stories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stories (
    id integer NOT NULL,
    user_id integer NOT NULL,
    place_id integer NOT NULL,
    media_type character varying NOT NULL,
    media_url character varying NOT NULL,
    thumbnail_url character varying,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.stories OWNER TO postgres;

--
-- Name: stories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stories_id_seq OWNER TO postgres;

--
-- Name: stories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stories_id_seq OWNED BY public.stories.id;


--
-- Name: user_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_blocks (
    id integer NOT NULL,
    blocker_id integer NOT NULL,
    blocked_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_blocks OWNER TO postgres;

--
-- Name: user_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_blocks_id_seq OWNER TO postgres;

--
-- Name: user_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_blocks_id_seq OWNED BY public.user_blocks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    password_hash character varying NOT NULL,
    username character varying,
    first_name character varying,
    last_name character varying,
    phone_number character varying,
    avatar_url character varying,
    bio character varying,
    birth_date date,
    role character varying,
    is_active boolean,
    is_email_verified boolean,
    push_token character varying,
    push_token_updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: email_verifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications ALTER COLUMN id SET DEFAULT nextval('public.email_verifications_id_seq'::regclass);


--
-- Name: follows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows ALTER COLUMN id SET DEFAULT nextval('public.follows_id_seq'::regclass);


--
-- Name: match_conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_conversations ALTER COLUMN id SET DEFAULT nextval('public.match_conversations_id_seq'::regclass);


--
-- Name: match_likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_likes ALTER COLUMN id SET DEFAULT nextval('public.match_likes_id_seq'::regclass);


--
-- Name: match_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_profiles ALTER COLUMN id SET DEFAULT nextval('public.match_profiles_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: places id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places ALTER COLUMN id SET DEFAULT nextval('public.places_id_seq'::regclass);


--
-- Name: post_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments ALTER COLUMN id SET DEFAULT nextval('public.post_comments_id_seq'::regclass);


--
-- Name: post_likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes ALTER COLUMN id SET DEFAULT nextval('public.post_likes_id_seq'::regclass);


--
-- Name: post_media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_media ALTER COLUMN id SET DEFAULT nextval('public.post_media_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: review_media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media ALTER COLUMN id SET DEFAULT nextval('public.review_media_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: saved_places id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_places ALTER COLUMN id SET DEFAULT nextval('public.saved_places_id_seq'::regclass);


--
-- Name: saved_posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_posts ALTER COLUMN id SET DEFAULT nextval('public.saved_posts_id_seq'::regclass);


--
-- Name: stories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories ALTER COLUMN id SET DEFAULT nextval('public.stories_id_seq'::regclass);


--
-- Name: user_blocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocks ALTER COLUMN id SET DEFAULT nextval('public.user_blocks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
ebc9379c7d94
\.


--
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_verifications (id, user_id, verification_code, expires_at, created_at) FROM stdin;
1	1	412902	2026-03-10 17:08:56.066042+03	2026-03-10 16:53:56.061819+03
\.


--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.follows (id, follower_id, following_id, created_at) FROM stdin;
\.


--
-- Data for Name: match_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_conversations (id, user1_id, user2_id, place_id, place_name, user1_revealed, user2_revealed, is_active, created_at, last_message_at) FROM stdin;
\.


--
-- Data for Name: match_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_likes (id, from_user_id, to_user_id, place_id, action, created_at) FROM stdin;
\.


--
-- Data for Name: match_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_profiles (id, user_id, display_name, age, bio, photo_urls, height, gender, education, location_text, smoking, drinking, looking_for, interests, star_sign, family_plans, exercise, prompts, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, sender_id, content, message_type, media_url, shared_post_id, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, actor_id, post_id, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_resets (id, user_id, reset_code, expires_at, attempts, created_at) FROM stdin;
\.


--
-- Data for Name: places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.places (id, name, address, city, description, vector_id, price_range, category, features, latitude, longitude, average_rating, photo_url, video_url, campaign_text, opening_time, closing_time) FROM stdin;
\.


--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_comments (id, user_id, post_id, parent_id, text, created_at) FROM stdin;
\.


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_likes (id, user_id, post_id, created_at) FROM stdin;
\.


--
-- Data for Name: post_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_media (id, post_id, media_type, media_url, thumbnail_url, duration_seconds, aspect_ratio, width, height, order_index) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, user_id, place_id, caption, post_type, like_count, comment_count, created_at) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, reporter_id, target_type, target_id, reason, description, status, created_at) FROM stdin;
\.


--
-- Data for Name: review_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review_media (id, review_id, media_type, media_url, thumbnail_url, width, height, file_size, duration_seconds, order_index, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, user_id, place_id, comment_text, rating, created_at, updated_at, is_verified, verify_method, verified_at, distance_meters, visit_date, visit_type, spent_amount, spent_currency, wait_time_minutes, ordered_items, food_rating, service_rating, atmosphere_rating, value_rating, cleanliness_rating, helpful_count, report_count, owner_response, owner_response_at) FROM stdin;
\.


--
-- Data for Name: saved_places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_places (id, user_id, place_id, created_at) FROM stdin;
\.


--
-- Data for Name: saved_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_posts (id, user_id, post_id, created_at) FROM stdin;
\.


--
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stories (id, user_id, place_id, media_type, media_url, thumbnail_url, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: user_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_blocks (id, blocker_id, blocked_id, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, username, first_name, last_name, phone_number, avatar_url, bio, birth_date, role, is_active, is_email_verified, push_token, push_token_updated_at, created_at) FROM stdin;
1	utku@mail.com	$2b$12$0wdy0MW04cna1BMbck7BqebrBLodaU0wDZy7NtqDPOW/pCiqHoOqO	\N	Utku	G	\N	\N	\N	2004-03-25	standard	t	f	\N	\N	2026-03-10 16:53:55.734321+03
\.


--
-- Name: email_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_verifications_id_seq', 1, true);


--
-- Name: follows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.follows_id_seq', 1, false);


--
-- Name: match_conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_conversations_id_seq', 1, false);


--
-- Name: match_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_likes_id_seq', 1, false);


--
-- Name: match_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_profiles_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: password_resets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_resets_id_seq', 1, false);


--
-- Name: places_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.places_id_seq', 1, false);


--
-- Name: post_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_comments_id_seq', 1, false);


--
-- Name: post_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_likes_id_seq', 1, false);


--
-- Name: post_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_media_id_seq', 1, false);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.posts_id_seq', 1, false);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


--
-- Name: review_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_media_id_seq', 1, false);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, false);


--
-- Name: saved_places_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saved_places_id_seq', 1, false);


--
-- Name: saved_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saved_posts_id_seq', 1, false);


--
-- Name: stories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stories_id_seq', 1, false);


--
-- Name: user_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_blocks_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: match_conversations match_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_conversations
    ADD CONSTRAINT match_conversations_pkey PRIMARY KEY (id);


--
-- Name: match_likes match_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_likes
    ADD CONSTRAINT match_likes_pkey PRIMARY KEY (id);


--
-- Name: match_profiles match_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_profiles
    ADD CONSTRAINT match_profiles_pkey PRIMARY KEY (id);


--
-- Name: match_profiles match_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_profiles
    ADD CONSTRAINT match_profiles_user_id_key UNIQUE (user_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: post_media post_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: review_media review_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media
    ADD CONSTRAINT review_media_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: saved_places saved_places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_places
    ADD CONSTRAINT saved_places_pkey PRIMARY KEY (id);


--
-- Name: saved_posts saved_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT saved_posts_pkey PRIMARY KEY (id);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: follows uq_follow_follower_following; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT uq_follow_follower_following UNIQUE (follower_id, following_id);


--
-- Name: match_conversations uq_match_conversation_users; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_conversations
    ADD CONSTRAINT uq_match_conversation_users UNIQUE (user1_id, user2_id);


--
-- Name: match_likes uq_match_like_from_to; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_likes
    ADD CONSTRAINT uq_match_like_from_to UNIQUE (from_user_id, to_user_id);


--
-- Name: post_likes uq_post_like_user_post; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT uq_post_like_user_post UNIQUE (user_id, post_id);


--
-- Name: saved_places uq_saved_place_user_place; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_places
    ADD CONSTRAINT uq_saved_place_user_place UNIQUE (user_id, place_id);


--
-- Name: saved_posts uq_saved_post_user_post; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT uq_saved_post_user_post UNIQUE (user_id, post_id);


--
-- Name: user_blocks uq_user_block; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT uq_user_block UNIQUE (blocker_id, blocked_id);


--
-- Name: user_blocks user_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_email_verifications_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_email_verifications_id ON public.email_verifications USING btree (id);


--
-- Name: ix_email_verifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_email_verifications_user_id ON public.email_verifications USING btree (user_id);


--
-- Name: ix_follows_follower_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_follows_follower_id ON public.follows USING btree (follower_id);


--
-- Name: ix_follows_following_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_follows_following_id ON public.follows USING btree (following_id);


--
-- Name: ix_follows_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_follows_id ON public.follows USING btree (id);


--
-- Name: ix_match_conversations_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_match_conversations_id ON public.match_conversations USING btree (id);


--
-- Name: ix_match_likes_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_match_likes_id ON public.match_likes USING btree (id);


--
-- Name: ix_match_profiles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_match_profiles_id ON public.match_profiles USING btree (id);


--
-- Name: ix_messages_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: ix_messages_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_messages_id ON public.messages USING btree (id);


--
-- Name: ix_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: ix_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: ix_password_resets_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_password_resets_id ON public.password_resets USING btree (id);


--
-- Name: ix_password_resets_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_password_resets_user_id ON public.password_resets USING btree (user_id);


--
-- Name: ix_places_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_places_category ON public.places USING btree (category);


--
-- Name: ix_places_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_places_id ON public.places USING btree (id);


--
-- Name: ix_places_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_places_name ON public.places USING btree (name);


--
-- Name: ix_places_vector_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_places_vector_id ON public.places USING btree (vector_id);


--
-- Name: ix_post_comments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_post_comments_id ON public.post_comments USING btree (id);


--
-- Name: ix_post_comments_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_post_comments_post_id ON public.post_comments USING btree (post_id);


--
-- Name: ix_post_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_post_comments_user_id ON public.post_comments USING btree (user_id);


--
-- Name: ix_post_likes_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_post_likes_id ON public.post_likes USING btree (id);


--
-- Name: ix_post_likes_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_post_likes_post_id ON public.post_likes USING btree (post_id);


--
-- Name: ix_post_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_post_likes_user_id ON public.post_likes USING btree (user_id);


--
-- Name: ix_post_media_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_post_media_id ON public.post_media USING btree (id);


--
-- Name: ix_post_media_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_post_media_post_id ON public.post_media USING btree (post_id);


--
-- Name: ix_posts_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_posts_created_at ON public.posts USING btree (created_at);


--
-- Name: ix_posts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_posts_id ON public.posts USING btree (id);


--
-- Name: ix_posts_place_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_posts_place_id ON public.posts USING btree (place_id);


--
-- Name: ix_posts_post_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_posts_post_type ON public.posts USING btree (post_type);


--
-- Name: ix_posts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_posts_user_id ON public.posts USING btree (user_id);


--
-- Name: ix_reports_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reports_id ON public.reports USING btree (id);


--
-- Name: ix_reports_reporter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reports_reporter_id ON public.reports USING btree (reporter_id);


--
-- Name: ix_review_media_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_review_media_id ON public.review_media USING btree (id);


--
-- Name: ix_review_media_review_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_review_media_review_id ON public.review_media USING btree (review_id);


--
-- Name: ix_reviews_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reviews_id ON public.reviews USING btree (id);


--
-- Name: ix_reviews_place_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reviews_place_id ON public.reviews USING btree (place_id);


--
-- Name: ix_reviews_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reviews_user_id ON public.reviews USING btree (user_id);


--
-- Name: ix_saved_places_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_saved_places_id ON public.saved_places USING btree (id);


--
-- Name: ix_saved_places_place_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_saved_places_place_id ON public.saved_places USING btree (place_id);


--
-- Name: ix_saved_places_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_saved_places_user_id ON public.saved_places USING btree (user_id);


--
-- Name: ix_saved_posts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_saved_posts_id ON public.saved_posts USING btree (id);


--
-- Name: ix_saved_posts_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_saved_posts_post_id ON public.saved_posts USING btree (post_id);


--
-- Name: ix_saved_posts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_saved_posts_user_id ON public.saved_posts USING btree (user_id);


--
-- Name: ix_stories_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stories_expires_at ON public.stories USING btree (expires_at);


--
-- Name: ix_stories_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stories_id ON public.stories USING btree (id);


--
-- Name: ix_stories_place_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stories_place_id ON public.stories USING btree (place_id);


--
-- Name: ix_stories_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stories_user_id ON public.stories USING btree (user_id);


--
-- Name: ix_user_blocks_blocked_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_blocks_blocked_id ON public.user_blocks USING btree (blocked_id);


--
-- Name: ix_user_blocks_blocker_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_blocks_blocker_id ON public.user_blocks USING btree (blocker_id);


--
-- Name: ix_user_blocks_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_blocks_id ON public.user_blocks USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_phone_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_phone_number ON public.users USING btree (phone_number);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: email_verifications email_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id);


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id);


--
-- Name: match_conversations match_conversations_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_conversations
    ADD CONSTRAINT match_conversations_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id);


--
-- Name: match_conversations match_conversations_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_conversations
    ADD CONSTRAINT match_conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(id);


--
-- Name: match_conversations match_conversations_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_conversations
    ADD CONSTRAINT match_conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(id);


--
-- Name: match_likes match_likes_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_likes
    ADD CONSTRAINT match_likes_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id);


--
-- Name: match_likes match_likes_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_likes
    ADD CONSTRAINT match_likes_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id);


--
-- Name: match_likes match_likes_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_likes
    ADD CONSTRAINT match_likes_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id);


--
-- Name: match_profiles match_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_profiles
    ADD CONSTRAINT match_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.match_conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.post_comments(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: post_media post_media_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posts posts_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id);


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: review_media review_media_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media
    ADD CONSTRAINT review_media_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id);


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: saved_places saved_places_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_places
    ADD CONSTRAINT saved_places_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: saved_places saved_places_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_places
    ADD CONSTRAINT saved_places_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: saved_posts saved_posts_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT saved_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: saved_posts saved_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT saved_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: stories stories_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id);


--
-- Name: stories stories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_blocks user_blocks_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_blocks user_blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 8aW281SunkSMbIDAIIGlge5Sjm7I2KaNhg6pfPsJZGUl9CvwvghDgQaOapO7Rij

