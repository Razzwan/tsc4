const getStr = (n) => `      if (m == ${n}) {
        r${n}~tpush(mult_2_tuples(a_n, b_p));
      }\n`;

let res = '';
for (let i = 0; i < 32; i++) {
	res += getStr(i);
}

console.log(res);
