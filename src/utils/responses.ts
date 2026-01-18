const successResponse = (message?: string, data?: any) => {
  return {
    success: true,
    data: {
      message,
      ...data,
    },
  };
};

const errorResponse = (errorMessage?: string) => {
  return {
    success: false,
    error: errorMessage,
  };
};

export { successResponse, errorResponse };
