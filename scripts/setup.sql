drop table if exists accounts;

create table accounts (
	id tinytext not null,
	name text not null,
	is_disabled tinyint not null default 0,
	email varchar(255) not null,
	password tinytext not null,
	"type" tinyint not null default 0,
	created timestamp not null default CURRENT_TIMESTAMP,
	lastchange timestamp not null default CURRENT_TIMESTAMP,
	token tinytext not null default '',
	settings text not null default '{}'
);

drop table if exists transactions;

create table transactions (
	id tinytext not null,
	"from" tinytext not null,
	"to" tinytext not null,
	timestamp timestamp not null default CURRENT_TIMESTAMP,
	amount number not null,
	metadata text not null default '{}',
	memo text not null default 0
);
