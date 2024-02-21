DROP TRIGGER IF EXISTS documents_change_trigger;

CREATE TRIGGER documents_change_trigger AFTER INSERT ON tblDocuments
FOR EACH ROW
BEGIN
    DECLARE json_data JSON;

    -- Prepare JSON data of inserted record
    SET json_data = JSON_OBJECT(
        'id', NEW.id,
        'name', NEW.name,
        'comment', NEW.comment,
        'date', NEW.date,
        'expires', NEW.expires,
        'owner', NEW.owner,
        'folder', NEW.folder,
        'folderList', (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('folder_id', f.id, 'folder_name', f.name))
            FROM tblFolders f
            WHERE f.id = NEW.folder
        ),
        'inheritAccess', NEW.inheritAccess,
        'defaultAccess', NEW.defaultAccess,
        'locked', NEW.locked,
        'keywords', (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('keyword', SUBSTRING_INDEX(SUBSTRING_INDEX(NEW.keywords, ',', numbers.n), ',', -1)))
            FROM (
                SELECT
                  a.N + b.N * 10 + 1 AS n
                FROM
                  (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a
                  CROSS JOIN
                  (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS b
                ORDER BY n
            ) AS numbers
            WHERE numbers.n <= LENGTH(NEW.keywords) - LENGTH(REPLACE(NEW.keywords, ',', '')) + 1
        ),
        'sequence', NEW.sequence,
        'timestamp', NOW()
    );

    -- Insert JSON data into QueueItem table
    INSERT INTO QueueItems (task, data) VALUES ('process_document', json_data);
END;
