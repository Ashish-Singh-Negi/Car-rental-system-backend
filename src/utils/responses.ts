const successResponse = (message: string, data: {}) => {
  return {
    success: true,
    data: {
      message,
      ...data,
    },
  };
};

const errorResponse = (message: string, error?: any) => {
  return {
    success: false,
    err: {
      message,
      error,
    },
  };
};

export { successResponse, errorResponse };
