#[tauri::command]
fn calculate(expression: String) -> String {
    let expr = expression.trim();
    if expr.is_empty() {
        return "0".to_string();
    }

    match eval_simple(expr) {
        Ok(result) => result,
        Err(_) => "Error".to_string(),
    }
}

fn eval_simple(expr: &str) -> Result<String, ()> {
    let tokens = tokenize(expr)?;
    let result = compute(&tokens)?;
    let num: f64 = result;
    if num.fract() == 0.0 && num.is_finite() {
        Ok(format!("{}", num as i64))
    } else if num.is_infinite() || num.is_nan() {
        Err(())
    } else {
        Ok(format!("{:.10}", num).trim_end_matches('0').trim_end_matches('.').to_string())
    }
}

#[derive(Debug, Clone, PartialEq)]
enum Token {
    Number(f64),
    Op(char),
}

fn tokenize(expr: &str) -> Result<Vec<Token>, ()> {
    let mut tokens = Vec::new();
    let mut chars = expr.chars().peekable();

    while let Some(ch) = chars.next() {
        match ch {
            '0'..='9' | '.' => {
                let mut num = String::from(ch);
                while let Some(&nch) = chars.peek() {
                    if nch.is_ascii_digit() || nch == '.' {
                        num.push(chars.next().unwrap());
                    } else {
                        break;
                    }
                }
                let val: f64 = num.parse().map_err(|_| ())?;
                tokens.push(Token::Number(val));
            }
            '+' | '-' | '×' | '÷' | '*' | '/' => {
                let op = match ch {
                    '×' | '*' => '*',
                    '÷' | '/' => '/',
                    _ => ch,
                };
                tokens.push(Token::Op(op));
            }
            ' ' => {}
            _ => return Err(()),
        }
    }
    Ok(tokens)
}

fn compute(tokens: &[Token]) -> Result<f64, ()> {
    let mut ops: Vec<char> = Vec::new();
    let mut nums: Vec<f64> = Vec::new();

    let mut i = 0;
    while i < tokens.len() {
        match &tokens[i] {
            Token::Number(n) => nums.push(*n),
            Token::Op(op) => {
                while !ops.is_empty() && precedence(*op) <= precedence(ops[ops.len() - 1]) {
                    apply_op(&mut nums, ops.pop().unwrap())?;
                }
                ops.push(*op);
            }
        }
        i += 1;
    }

    while !ops.is_empty() {
        apply_op(&mut nums, ops.pop().unwrap())?;
    }

    nums.pop().ok_or(())
}

fn precedence(op: char) -> i32 {
    match op {
        '+' | '-' => 1,
        '*' | '/' => 2,
        _ => 0,
    }
}

fn apply_op(nums: &mut Vec<f64>, op: char) -> Result<(), ()> {
    let b = nums.pop().ok_or(())?;
    let a = nums.pop().ok_or(())?;
    let result = match op {
        '+' => a + b,
        '-' => a - b,
        '*' => a * b,
        '/' => {
            if b == 0.0 {
                return Err(());
            }
            a / b
        }
        _ => return Err(()),
    };
    nums.push(result);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![calculate])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
