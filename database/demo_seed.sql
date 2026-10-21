-- LifeDrop synthetic demo data only.
-- All names, emails and phone numbers below are fictional.

INSERT IGNORE INTO users
(user_id, full_name, email, password_hash, phone, role)
VALUES
(1, 'LifeDrop Demo Requester', 'demo.requester@example.com', 'DEMO_ACCOUNT_NOT_FOR_LOGIN', '9000000001', 'user'),
(2, 'Demo Placeholder 2', 'placeholder2@example.com', 'DEMO_ACCOUNT_NOT_FOR_LOGIN', '9000000002', 'user'),
(3, 'Demo Placeholder 3', 'placeholder3@example.com', 'DEMO_ACCOUNT_NOT_FOR_LOGIN', '9000000003', 'user'),
(4, 'Demo Placeholder 4', 'placeholder4@example.com', 'DEMO_ACCOUNT_NOT_FOR_LOGIN', '9000000004', 'user'),
(5, 'Demo Placeholder 5', 'placeholder5@example.com', 'DEMO_ACCOUNT_NOT_FOR_LOGIN', '9000000005', 'user');

INSERT IGNORE INTO users
(user_id, full_name, email, password_hash, phone, role)
WITH RECURSIVE seq AS (
    SELECT 6 AS n
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 105
)
SELECT
    n,
    CONCAT('Demo Donor ', LPAD(n - 5, 3, '0')),
    CONCAT('demo.donor.', n, '@example.com'),
    'DEMO_ACCOUNT_NOT_FOR_LOGIN',
    CONCAT('9000', LPAD(n, 6, '0')),
    'user'
FROM seq;

INSERT IGNORE INTO donor_profiles
(user_id, blood_group, date_of_birth, city, state, is_available)
WITH RECURSIVE seq AS (
    SELECT 6 AS n
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 105
)
SELECT
    n,
    CASE MOD(n - 6, 8)
        WHEN 0 THEN 'O+'
        WHEN 1 THEN 'A+'
        WHEN 2 THEN 'B+'
        WHEN 3 THEN 'AB+'
        WHEN 4 THEN 'O-'
        WHEN 5 THEN 'A-'
        WHEN 6 THEN 'B-'
        ELSE 'AB-'
    END,
    DATE_SUB(CURDATE(), INTERVAL (20 + MOD(n, 25)) YEAR),
    CASE MOD(n, 5)
        WHEN 0 THEN 'Mangaluru'
        WHEN 1 THEN 'Bengaluru'
        WHEN 2 THEN 'Mysuru'
        WHEN 3 THEN 'Udupi'
        ELSE 'Hubballi'
    END,
    'Karnataka',
    TRUE
FROM seq;

INSERT IGNORE INTO blood_requests
(request_id, requester_id, blood_group, units_required, hospital_name, city, state, urgency, status, required_by)
VALUES
(1, 1, 'O+', 2, 'Demo City Hospital', 'Mangaluru', 'Karnataka', 'urgent', 'open', DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
(2, 1, 'A+', 1, 'Demo Central Hospital', 'Bengaluru', 'Karnataka', 'normal', 'open', DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
(3, 1, 'B+', 2, 'Demo Community Hospital', 'Mysuru', 'Karnataka', 'emergency', 'open', DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
(4, 1, 'AB+', 1, 'Demo Coastal Hospital', 'Udupi', 'Karnataka', 'normal', 'open', DATE_ADD(CURDATE(), INTERVAL 4 DAY)),
(5, 1, 'O-', 1, 'Demo North Hospital', 'Hubballi', 'Karnataka', 'urgent', 'open', DATE_ADD(CURDATE(), INTERVAL 2 DAY));
