insert into profiles (id, name, email, password) values
("a1b2c3d4e5f678901234567890abcdef", "Alice", "alice@example.com", "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"), --password=password
("b1c2d3e4f5a678901234567890abcdef", "Bob", "bob@example.com", "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"), --password=123
("c1d2e3f4a5b678901234567890abcdef", "Charlie", "charlie@example.com", "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"); --password=admin

-- Accounts Seed Data
insert into accounts (id, profile, name, type) values
("d1e2f3a4b5c678901234567890abcdef", "a1b2c3d4e5f678901234567890abcdef", "Checking", "checking"),
("e1f2a3b4c5d678901234567890abcdef", "b1c2d3e4f5a678901234567890abcdef", "Savings", "savings"),
("f1a2b3c4d5e678901234567890abcdef", "c1d2e3f4a5b678901234567890abcdef", "Investment", "savings");

-- Transactions Seed Data
insert into transactions (id, "from", "to", amount, memo) values
("f2e3d4c5b6a789012345678901abcdef", "d1e2f3a4b5c678901234567890abcdef", "e1f2a3b4c5d678901234567890abcdef", 100.50, "Payment for services"),
("a3b4c5d6e7f89012345678901abcdef2", "e1f2a3b4c5d678901234567890abcdef", "f1a2b3c4d5e678901234567890abcdef", 250.00, "Transfer to investment account"),
("b4c5d6e7f8a9012345678901abcdef23", "f1a2b3c4d5e678901234567890abcdef", "d1e2f3a4b5c678901234567890abcdef", 75.75, "Reimbursement");
