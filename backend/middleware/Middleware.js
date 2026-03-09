module.exports = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: "Acesso negado. Faça login para jogar." });
  
  req.user = { login: token }; 
  next();
};