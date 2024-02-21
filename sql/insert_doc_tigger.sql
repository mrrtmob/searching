DROP TRIGGER IF EXISTS documents_change_trigger;

CREATE TRIGGER documents_change_trigger AFTER INSERT ON tblDocumentContent
FOR EACH ROW
BEGIN
    DECLARE json_data JSON;

    -- Prepare JSON data of inserted record
    SET json_data = JSON_OBJECT(
        'id', NEW.id,
        'document', NEW.document,
        'version', NEW.version,
        'comment', NEW.comment,
        'date', NEW.date,
        'createdBy', NEW.createdBy,
        'dir', NEW.dir,
        'orgFileName', NEW.orgFileName,
        'fileType', NEW.fileType,
        'mimeType', NEW.mimeType,
        'fileSize', NEW.fileSize,
        'checksum', NEW.checksum,
        'revisiondate', NEW.revisiondate
    );

    -- Insert JSON data into QueueItem table
    INSERT INTO QueueItems (task, data) VALUES ('process_document', json_data);
END;
