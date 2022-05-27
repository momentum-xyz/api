DELIMITER $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetAtomicUsersByID`(IN user_id binary(16), IN t_lev INT)
BEGIN with recursive cte as (
    select id,
           0 as level
    from users
    where id = user_id
    union all
    select u.id,
           level + 1
    from user_membership u
             inner join cte on u.memberOf = cte.id
    where level < t_lev
)
      select distinct(cte.id),
                     level
      from cte;

END $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetCompoundUsersByID`(IN user_id binary(16), IN t_lev INT)
BEGIN with recursive cte as (
    select id,
           0 as level
    from users
    where id = user_id
    union all
    select u.memberOf as id,
           level + 1
    from user_membership u
             inner join cte on u.id = cte.id
    where level < t_lev
)
      select distinct(cte.id),
                     level
      from cte;
END $$

CREATE DEFINER=`root`@`%` FUNCTION `momentum-test`.`GetParentSomething`(GivenID binary(16)) RETURNS binary(16)
    DETERMINISTIC
BEGIN
DECLARE rv binary(16);
DECLARE ch binary(16);
set rv = GivenID;
set ch = GivenID;
while ch != 0x00000000000000000000000000000000 do
set rv = ch;
SELECT IFNULL(parentId, -1) INTO ch
FROM (
         SELECT parentId
         FROM spaces
         WHERE id = rv
     ) A;
END while;
RETURN rv;
END $$

CREATE DEFINER=`root`@`%` FUNCTION `momentum-test`.`GetParentWorldByID`(GivenID binary(16)) RETURNS binary(16)
    DETERMINISTIC
BEGIN
DECLARE rv binary(16);
DECLARE ch binary(16);
set rv = GivenID;
set ch = GivenID;
while ch != 0x00000000000000000000000000000000 do
set rv = ch;
SELECT IFNULL(parentId, -1) INTO ch
FROM (
         SELECT parentId
         FROM spaces
         WHERE id = rv
     ) A;
END while;
RETURN rv;
END $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetSpaceAccessUsers`(IN t_pid binary(16))
BEGIN with users1 as (
    with recursive cte1 as (
        select id,
               parentId
        from spaces
        where id = t_pid
        union all
        select p.id,
               p.parentId
        from spaces p
                 inner join cte1 on cte1.parentId = p.id
    )
    select distinct(user_spaces.userId)
    from cte1
             inner join user_spaces on cte1.id = user_spaces.spaceId
    where user_spaces.isAdmin = 1
),
           admins1 as (
               with recursive cte2 as (
                   select id,
                          parentId
                   from spaces
                   where id = t_pid
                   union all
                   select p.id,
                          p.parentId
                   from spaces p
                            inner join cte2 on p.parentId = cte2.id
               )
               select distinct(user_spaces.userId)
               from cte2
                        inner join user_spaces on cte2.id = user_spaces.spaceId
           ),online1 as (
        select userId from online_users where spaceId = t_pid
    )
      select *
      from users1
      union
      DISTINCT
select *
from admins1
union
DISTINCT
select *
from online1;
END $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetSpaceAccessUsers1`(IN t_pid binary(16))
BEGIN with users1 as (
    with recursive cte1 as (
        select id,
               parentId
        from spaces
        where id = t_pid
        union all
        select p.id,
               p.parentId
        from spaces p
                 inner join cte1 on cte1.parentId = p.id
    )
    select distinct(user_spaces.userId)
    from cte1
             inner join user_spaces on cte1.id = user_spaces.spaceId
    where user_spaces.isAdmin = 1
),
           admins1 as (
               with recursive cte2 as (
                   select id,
                          parentId
                   from spaces
                   where id = t_pid
                   union all
                   select p.id,
                          p.parentId
                   from spaces p
                            inner join cte2 on p.parentId = cte2.id
               )
               select distinct(user_spaces.userId)
               from cte2
                        inner join user_spaces on cte2.id = user_spaces.spaceId
           ),online1 as (
        select userId from online_users where spaceId = t_pid
    )
      select *
      from users1
      union
      DISTINCT
select *
from admins1
union
DISTINCT
select *
from online1;
END $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetSpaceAdmins`(IN t_pid binary(16))
BEGIN WITH RECURSIVE
          spaces_cte as (
              select id as space_id,
                     parentId
              from spaces
              where id = t_pid
              union all
              select p.id,
                     p.parentId
              from spaces p
                       inner join spaces_cte on p.id = spaces_cte.parentId
          ),
          space_users_cte AS (
              SELECT userId AS user_id, spaceId AS space_id
              FROM user_spaces
                       INNER JOIN spaces_cte ON user_spaces.spaceId = spaces_cte.space_id
              WHERE user_spaces.isAdmin = 1
          ),
          users_cte as (
              select user_id
              from space_users_cte
              union all
              select u.id as user_id
              from user_membership u
                       inner join users_cte on u.memberOf = users_cte.user_id
              WHERE u.isAdmin = 1
          )
      SELECT distinct(users_cte.user_id) as userId
      FROM users_cte

;
END $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetSpaceAncestorsIDs`(IN t_pid binary(16), IN t_lev INT)
BEGIN with recursive cte as (
    select id,
           parentId,
           0 as level
    from spaces
    where id = t_pid
    union all
    select p.id,
           p.parentId,
           level + 1
    from spaces p
             inner join cte on cte.parentId = p.id
    where level < t_lev
)
      select id,
             parentId,
             level
      from cte;
END $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetSpaceAncestorsTable`(IN t_pid binary(16), IN t_lev INT)
BEGIN with recursive cte as (
    select *,
           0 as level
    from spaces
    where id = t_pid
    union all
    select p.*,
           level + 1
    from spaces p
             inner join cte on cte.parentId = p.id
    where level < t_lev
)
      select *
      from cte;
END $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetSpaceAncestorsTableAdminRole`(IN t_pid binary(16), IN t_uid binary(16))
BEGIN with recursive cte as (
    select *,
           0 as level
    from spaces
    where id = t_pid
    union all
    select p.*,
           level + 1
    from spaces p
             inner join cte on cte.parentId = p.id
)
      select cte.*,
             BIT_OR((IFNULL(user_spaces.isAdmin, 0) != 0)) OVER(
        order by level DESC
    ) as isAdmin
      from cte
               left join user_spaces on cte.id = user_spaces.spaceId
          and user_spaces.userId = t_uid;
END $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetSpaceDescendantsIDs`(IN t_pid binary(16), IN t_lev INT)
BEGIN with recursive cte as (
    select id,
           parentId,
           0 as level
    from spaces
    where id = t_pid
    union all
    select p.id,
           p.parentId,
           level + 1
    from spaces p
             inner join cte on p.parentId = cte.id
    where level < t_lev
)
      select id,
             parentId,
             level
      from cte;
END $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetSpaceDescendantsTable`(IN t_pid binary(16), IN t_lev INT)
BEGIN with recursive cte as (
    select *,
           0 as level
    from spaces
    where id = t_pid
    union all
    select p.*,
           level + 1
    from spaces p
             inner join cte on p.parentId = cte.id
    where level < t_lev
)
      select *
      from cte;
END $$

CREATE DEFINER=`root`@`%` PROCEDURE `momentum-test`.`GetSpaceUsers`(IN t_pid binary(16))
BEGIN WITH RECURSIVE
          spaces_cte as (
              select id as space_id,
                     parentId
              from spaces
              where id = t_pid
              union all
              select p.id,
                     p.parentId
              from spaces p
                       inner join spaces_cte on p.parentId = spaces_cte.space_id
          ),
          space_users_cte AS (
              SELECT userId AS user_id, spaceId AS space_id
              FROM user_spaces
                       INNER JOIN spaces_cte ON user_spaces.spaceId = spaces_cte.space_id
          ),
          users_cte as (
              select user_id
              from space_users_cte
              union all
              select u.id as user_id
              from user_membership u
                       inner join users_cte on u.memberOf = users_cte.user_id
          )
      SELECT distinct(users_cte.user_id) as userId
      FROM users_cte

;
END $$


DELIMITER ;