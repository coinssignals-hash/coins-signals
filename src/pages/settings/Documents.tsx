import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText, Check, Clock, AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const documentHistory = [
  { name: 'Prueba de Identidad', file: 'DOB-78-identidad-gjfnc.pdf', date: '23/03/2024', status: 'verified' },
  { name: 'Prueba de Residencia', file: 'DOB-84-factura-xpn.pdf', date: '23/03/2024', status: 'pending' },
];

export default function Documents() {
  const [expandedSection, setExpandedSection] = useState<string>('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-primary/20 text-primary"><Check className="w-3 h-3 mr-1" />Verificado</Badge>;
      case 'pending':
        return <Badge className="bg-accent/20 text-accent"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge className="bg-destructive/20 text-destructive"><AlertCircle className="w-3 h-3 mr-1" />Requerido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <span className="text-xs text-muted-foreground">ID # 0572564</span>
            <h1 className="text-xl font-bold text-foreground">Documentos</h1>
          </div>
        </div>

        <div className="space-y-4">
          <Accordion type="single" collapsible value={expandedSection} onValueChange={setExpandedSection}>
            <AccordionItem value="identity" className="border-border">
              <Card className="bg-card border-border">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">Prueba de Identidad</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Los formatos de archivos aceptados son: GIF, JPG, PNG, PDF
                    </p>
                    <p className="text-sm text-muted-foreground">
                      El tamaño máximo de archivo para subir es de 5MB
                    </p>
                    <p className="text-sm text-foreground">
                      Una copia en color de un pasaporte válido u otro documento de identificación oficial 
                      (Por ejemplo: licencia de conducir, documento de identidad, etc). La identificación 
                      debe ser válida y contener el nombre completo del cliente, una fecha de emisión o 
                      de caducidad, el lugar de nacimiento del cliente O un número de identificación fiscal 
                      y la firma del cliente.
                    </p>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Documento
                    </Button>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>

            <AccordionItem value="residence" className="border-border mt-4">
              <Card className="bg-card border-border">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">Prueba de Residencia</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Los formatos de archivos aceptados son: GIF, JPG, PNG, PDF
                    </p>
                    <p className="text-sm text-muted-foreground">
                      El tamaño máximo de archivo para subir es de 5MB
                    </p>
                    <p className="text-sm text-foreground">
                      Por favor, suba uno de los documentos siguientes como prueba de residencia:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      <li>Factura reciente de servicios (como electricidad, gas, agua, teléfono, internet, tv por cable)</li>
                    </ul>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Documento
                    </Button>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>

            <AccordionItem value="legal" className="border-border mt-4">
              <Card className="bg-card border-border">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">Documentos Legales</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground">
                    Coins Signals tiene la obligación legal de conservar en sus registros 
                    la documentación necesaria que respalde su solicitud. No se permitirá 
                    operar ni retirar dinero hasta que sus documentos hayan sido recibidos 
                    y verificados.
                  </p>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="text-sm text-primary">Historial de Documentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documentHistory.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.file}</p>
                    <p className="text-xs text-muted-foreground">{doc.date}</p>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
