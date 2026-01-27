use shopify_function::prelude::*;
use shopify_function::Result;

#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let mut discounts = Vec::new();

    // Group cart lines by bundle ID
    let bundles = group_lines_by_bundle_id(&input.cart.lines);

    // Process each bundle
    for (_bundle_id, bundle_lines) in bundles {
        if let Some(discount) = process_fbt_bundle(&bundle_lines) {
            discounts.push(discount);
        }
    }

    Ok(output::FunctionRunResult {
        discounts,
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    })
}

fn group_lines_by_bundle_id(lines: &[input::CartLine]) -> std::collections::HashMap<String, Vec<&input::CartLine>> {
    let mut bundles: std::collections::HashMap<String, Vec<&input::CartLine>> = std::collections::HashMap::new();

    for line in lines {
        if let Some(bundle_attr) = &line.attribute {
            if let Some(bundle_id) = &bundle_attr.value {
                bundles
                    .entry(bundle_id.clone())
                    .or_insert_with(Vec::new)
                    .push(line);
            }
        }
    }

    bundles
}

fn process_fbt_bundle(bundle_lines: &[&input::CartLine]) -> Option<output::Discount> {
    // Need at least 2 products for a bundle
    if bundle_lines.len() < 2 {
        return None;
    }

    let first_line = bundle_lines[0];

    // Extract bundle metadata
    let expected_count: usize = first_line
        .fbt_product_count
        .as_ref()
        .and_then(|attr| attr.value.as_ref())
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);

    let discount_type = first_line
        .fbt_discount_type
        .as_ref()
        .and_then(|attr| attr.value.as_ref())?;

    let discount_value: f64 = first_line
        .fbt_discount_value
        .as_ref()
        .and_then(|attr| attr.value.as_ref())
        .and_then(|v| v.parse().ok())
        .unwrap_or(0.0);

    // Validate bundle completeness
    if bundle_lines.len() != expected_count {
        return None;
    }

    // Validate discount configuration
    if discount_value <= 0.0 {
        return None;
    }

    // Apply discount based on type
    match discount_type.to_uppercase().as_str() {
        "PERCENTAGE" => apply_percentage_discount(bundle_lines, discount_value),
        "FIXED" => apply_fixed_discount(bundle_lines, discount_value),
        _ => None,
    }
}

fn apply_percentage_discount(bundle_lines: &[&input::CartLine], percentage: f64) -> Option<output::Discount> {
    let targets: Vec<output::Target> = bundle_lines
        .iter()
        .map(|line| output::Target {
            product_variant: Some(output::ProductVariantTarget {
                id: line.merchandise.id().to_string(),
                quantity: None,
            }),
        })
        .collect();

    Some(output::Discount {
        message: Some(format!("{}% bundle discount", percentage)),
        targets,
        value: output::Value {
            percentage: Some(output::Percentage {
                value: percentage.to_string(),
            }),
            fixed_amount: None,
        },
    })
}

fn apply_fixed_discount(bundle_lines: &[&input::CartLine], fixed_amount: f64) -> Option<output::Discount> {
    // Calculate bundle subtotal
    let subtotal: f64 = bundle_lines
        .iter()
        .map(|line| {
            let amount: f64 = line
                .cost
                .amount_per_quantity
                .amount
                .parse()
                .unwrap_or(0.0);
            amount * line.quantity as f64
        })
        .sum();

    // Cap discount at subtotal
    let capped_discount = fixed_amount.min(subtotal);

    let targets: Vec<output::Target> = bundle_lines
        .iter()
        .map(|line| output::Target {
            product_variant: Some(output::ProductVariantTarget {
                id: line.merchandise.id().to_string(),
                quantity: None,
            }),
        })
        .collect();

    Some(output::Discount {
        message: Some("Bundle discount".to_string()),
        targets,
        value: output::Value {
            percentage: None,
            fixed_amount: Some(output::FixedAmount {
                amount: format!("{:.2}", capped_discount),
            }),
        },
    })
}
