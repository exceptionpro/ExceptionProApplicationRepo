INSERT INTO users (id, email, password, account_type, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@exceptionpro.com', '$2a$12$q7.bMsw96nB9r1vBqR6Dce8GvHk9z2WvY3hBvB.o1.sV4.u7pBwV2', 'Individual', 'ROLE_ADMIN');

INSERT INTO individual_profiles (id, user_id, first_name, last_name, dob, gender)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'System', 'Admin', '1990-01-01', 'Male');
