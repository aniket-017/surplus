function formatError(error) {
  if (!error) return "Unknown error";

  const parts = [error.message || String(error)];

  if (error.stack) {
    parts.push(error.stack);
  }

  if (error.status) {
    parts.push(`status=${error.status}`);
  }

  if (error.statusText) {
    parts.push(`statusText=${error.statusText}`);
  }

  if (error.errorDetails) {
    parts.push(`details=${JSON.stringify(error.errorDetails)}`);
  }

  return parts.join("\n");
}

export function createLogger(scope) {
  return {
    info(message, meta) {
      if (meta !== undefined) {
        console.log(`[${scope}] ${message}`, meta);
      } else {
        console.log(`[${scope}] ${message}`);
      }
    },
    warn(message, meta) {
      if (meta !== undefined) {
        console.warn(`[${scope}] ${message}`, meta);
      } else {
        console.warn(`[${scope}] ${message}`);
      }
    },
    error(message, error) {
      console.error(`[${scope}] ${message}`);
      console.error(formatError(error));
    },
  };
}

export function describeUploadFile(file, index) {
  return {
    index,
    name: file.originalname,
    mimetype: file.mimetype,
    sizeKb: file.buffer ? Math.round(file.buffer.length / 1024) : 0,
  };
}
