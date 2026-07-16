/**
 * Convert a number to English words.
 * Supports numbers >= 100, negatives, and floating point decimals
 * (specifically 'and a Half' for 0.5 day counts).
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  let words = '';
  
  if (num < 0) {
    words = 'Minus ';
    num = Math.abs(num);
  }

  const intPart = Math.floor(num);
  const fracPart = num - intPart;

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertLessThanThousand(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  }

  function convert(n: number): string {
    if (n === 0) return '';
    let result = '';
    let temp = n;

    const crore = Math.floor(temp / 10000000);
    temp %= 10000000;

    const lakh = Math.floor(temp / 100000);
    temp %= 100000;

    const thousand = Math.floor(temp / 1000);
    temp %= 1000;

    const hundred = Math.floor(temp / 100);
    temp %= 100;

    if (crore > 0) {
      result += convertLessThanThousand(crore) + ' Crore ';
    }
    if (lakh > 0) {
      result += convertLessThanThousand(lakh) + ' Lakh ';
    }
    if (thousand > 0) {
      result += convertLessThanThousand(thousand) + ' Thousand ';
    }
    if (hundred > 0) {
      result += ones[hundred] + ' Hundred ';
    }
    if (temp > 0) {
      if (result !== '' && temp < 100) {
        result += 'and ' + convertLessThanThousand(temp) + ' ';
      } else {
        result += convertLessThanThousand(temp) + ' ';
      }
    }
    return result.trim();
  }

  let intWords = convert(intPart);
  if (intWords === '') {
    intWords = 'Zero';
  }
  words += intWords;

  if (Math.abs(fracPart - 0.5) < 0.0001) {
    words += ' and a Half';
  } else if (fracPart > 0) {
    const decimals = Math.round(fracPart * 100);
    if (decimals > 0) {
      const digits = String(decimals).split('');
      const digitWords = digits.map(d => {
        const idx = parseInt(d, 10);
        return idx === 0 ? 'Zero' : ones[idx];
      }).join(' ');
      words += ' Point ' + digitWords;
    }
  }

  return words.trim();
}

/**
 * Format a number into Indian Rupees format with 'Rs.' prefix.
 * e.g. Rs. 1,23,456.78
 */
export function formatCurrency(val: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
  return `Rs. ${formatted}`;
}
