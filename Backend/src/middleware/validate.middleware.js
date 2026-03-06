export const validate =
  (schema, target = "body") =>
  (req, res, next) => {
    let dataToValidate;

    switch (target) {
      case "body":
        dataToValidate = req.body;
        break;
      case "params":
        dataToValidate = req.params;
        break;
      case "query":
        dataToValidate = req.query;
        break;
      default:
        dataToValidate = {
          body: req.body,
          params: req.params,
          query: req.query,
        };
    }

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.errors,
      });
    }

    req.validated = result.data;
    next();
  };
