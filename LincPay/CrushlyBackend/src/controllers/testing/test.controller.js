module.exports = (dependencies) => {
  return async (req, res) => {
    res.status(200).json({
      status: true,
      msg: 'testing Data',
      data: ''
    });
  };
};
