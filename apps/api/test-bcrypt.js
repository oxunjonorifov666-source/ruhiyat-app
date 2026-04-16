const bcrypt = require('bcryptjs');

async function test() {
  const hash123 = '$2b$12$d1eN2YXF2bfTSXtFTFdQNe5vLfoHAH4ArHJk8.12r7TKlGC07bZgy';
  const hash123456 = '$2b$12$IHhCrY/6s84bnIHm/Mrsveq2Qz5wRQQF.UPbQOWTaG3CkE2DRvLkG';
  
  console.log("admin123:", await bcrypt.compare('admin123', hash123));
  console.log("123456:", await bcrypt.compare('123456', hash123456));
}

test();
