import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type CapturedProps = {
  value: number;
  valueText?: string;
  maxValueText?: string;
  label?: string;
};

const captured: CapturedProps[] = [];

type MacroSet = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

vi.mock('@/components/app/CircularProgress', () => ({
  __esModule: true,
  default: (props: CapturedProps & { children?: React.ReactNode }) => {
    captured.push(props);
    return (
      <div data-testid={`progress-${props.label ?? props.valueText ?? 'circle'}`}>
        <span>{props.valueText}</span>
        <span>{props.maxValueText}</span>
        {props.children}
      </div>
    );
  },
}));

let NutritionCircles: (props: {
  dailyNutrition: MacroSet;
  targets: MacroSet;
}) => JSX.Element;

beforeAll(async () => {
  const module = await import('@/components/app/NutritionCircles');
  NutritionCircles = module.default;
});

const dailyNutrition: MacroSet = {
  calories: 1850,
  protein: 120,
  carbs: 210,
  fat: 60,
};

const targets: MacroSet = {
  calories: 2000,
  protein: 150,
  carbs: 225,
  fat: 70,
};

beforeEach(() => {
  captured.length = 0;
});

describe('NutritionCircles', () => {
  it('renders formatted progress values and labels for each macro', () => {
    render(<NutritionCircles dailyNutrition={dailyNutrition} targets={targets} />);

    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByText('Protein')).toBeInTheDocument();
    expect(screen.getByText('Carbs')).toBeInTheDocument();
    expect(screen.getByText('Fat')).toBeInTheDocument();

    expect(screen.getByText('1,850')).toBeInTheDocument();
    expect(screen.getByText('2,000')).toBeInTheDocument();
    expect(screen.getByText('120g')).toBeInTheDocument();
    expect(screen.getByText('150g')).toBeInTheDocument();
    expect(screen.getByText('210g')).toBeInTheDocument();
    expect(screen.getByText('225g')).toBeInTheDocument();
    expect(screen.getByText('60g')).toBeInTheDocument();
    expect(screen.getByText('70g')).toBeInTheDocument();
  });

  it('caps progress at 100 percent when exceeding targets', () => {
    render(
      <NutritionCircles
        dailyNutrition={{ calories: 2600, protein: 200, carbs: 300, fat: 100 }}
        targets={targets}
      />
    );

    expect(captured).toHaveLength(4);
    captured.forEach((props) => {
      expect(props.value).toBeLessThanOrEqual(100);
    });
  });
});
