UPDATE users
SET
    full_name = CONCAT(
        ELT(MOD(user_id * 7, 20) + 1,
            'Aarav','Arjun','Rohan','Vikram','Aditya',
            'Rahul','Kiran','Sanjay','Nikhil','Akash',
            'Ananya','Priya','Sneha','Kavya','Aishwarya',
            'Meera','Pooja','Divya','Neha','Ishita'
        ),
        ' ',
        ELT(MOD(user_id * 11, 20) + 1,
            'Sharma','Patel','Shetty','Rao','Kumar',
            'Reddy','Nair','Shah','Joshi','Gowda',
            'Bhat','Poojary','Hegde','Verma','Singh',
            'Kulkarni','Desai','Mishra','Menon','Das'
        )
    ),
    phone = CONCAT(
        'DEMO-',
        LPAD(MOD(user_id * 7919 + 314159, 1000000), 6, '0')
    )
WHERE user_id BETWEEN 6 AND 105;
