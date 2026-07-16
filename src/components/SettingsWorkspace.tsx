import { useState, useEffect } from 'react';
import { useMguDb } from '@/lib/db';
import type { WageSettings } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RiSettings4Line, RiSave2Line, RiInformationLine } from '@remixicon/react';
import { toast } from 'sonner';

export const SettingsWorkspace = () => {
  const { settings, saveSettings } = useMguDb();

  // Draft states
  const [gardenersRate, setGardenersRate] = useState<number | ''>(500);
  const [driversRate, setDriversRate] = useState<number | ''>(600);
  const [cooksRate, setCooksRate] = useState<number | ''>(550);
  const [helpersRate, setHelpersRate] = useState<number | ''>(450);
  const [otRate, setOtRate] = useState<number | ''>(100);

  // Initialize draft values when settings load
  useEffect(() => {
    if (settings) {
      setGardenersRate(settings.wageRates.Gardeners);
      setDriversRate(settings.wageRates.Drivers);
      setCooksRate(settings.wageRates.Cooks);
      setHelpersRate(settings.wageRates.Helpers);
      setOtRate(settings.otRate);
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSettings: WageSettings = {
      wageRates: {
        Gardeners: Number(gardenersRate) || 0,
        Drivers: Number(driversRate) || 0,
        Cooks: Number(cooksRate) || 0,
        Helpers: Number(helpersRate) || 0
      },
      otRate: Number(otRate) || 0
    };

    const previousSettings = { ...settings };
    saveSettings(updatedSettings);
    toast.success("Settings updated successfully. All payroll summaries have been updated.", {
      action: {
        label: "Undo",
        onClick: () => saveSettings(previousSettings)
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Information Banner */}
      <Alert className="bg-primary/5 border-primary/20 text-foreground">
        <RiInformationLine className="size-5 text-primary" />
        <AlertTitle className="font-heading font-bold text-sm">Policy Calculations Notice</AlertTitle>
        <AlertDescription className="mt-1 text-xs">
          Modifying these rates will immediately re-compute payroll totals for all billing cycles.
          Overtime pay rules are locked: <strong>Gardeners are strictly excluded from overtime pay</strong> regardless of any OT attendance records.
        </AlertDescription>
      </Alert>

      {/* Wage rates Form */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="font-heading text-lg font-bold flex items-center gap-2">
            <RiSettings4Line className="text-primary size-5" />
            Wage Configuration Settings
          </CardTitle>
          <CardDescription>
            Configure daily base wages and overtime rates for contractual staff.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="flex flex-col gap-6">
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Daily Base Wage Rates (in Rupees)</h4>
              
              <FieldGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="gardeners">Gardeners Rate (₹)</FieldLabel>
                    <Input
                      id="gardeners"
                      type="number"
                      value={gardenersRate}
                      onChange={(e) => setGardenersRate(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="drivers">Drivers Rate (₹)</FieldLabel>
                    <Input
                      id="drivers"
                      type="number"
                      value={driversRate}
                      onChange={(e) => setDriversRate(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="cooks">Cooks Rate (₹)</FieldLabel>
                    <Input
                      id="cooks"
                      type="number"
                      value={cooksRate}
                      onChange={(e) => setCooksRate(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="helpers">Helpers Rate (₹)</FieldLabel>
                    <Input
                      id="helpers"
                      type="number"
                      value={helpersRate}
                      onChange={(e) => setHelpersRate(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </div>

            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 border-t pt-4">Overtime Rate Configuration</h4>
              
              <FieldGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="otRate">Flat Overtime Rate (₹ / Day)</FieldLabel>
                    <Input
                      id="otRate"
                      type="number"
                      value={otRate}
                      onChange={(e) => setOtRate(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end">
            <Button type="submit">
              <RiSave2Line data-icon="inline-start" />
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
