"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpc } from "@/components/TRPCProvider";
import { DiaSemana, TipoAmbiente } from "@prisma/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Loader2, Save, AlertCircle, Clock, MapPin, User, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const HORAS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

const COLORS = [
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-green-100 text-green-800 border-green-300",
  "bg-amber-100 text-amber-800 border-amber-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-pink-100 text-pink-800 border-pink-300",
  "bg-teal-100 text-teal-800 border-teal-300",
  "bg-indigo-100 text-indigo-800 border-indigo-300",
  "bg-rose-100 text-rose-800 border-rose-300",
  "bg-cyan-100 text-cyan-800 border-cyan-300",
];

const asignacionFilaSchema = z.object({
    tipo: z.nativeEnum(TipoAmbiente),
    dia: z.nativeEnum(DiaSemana),
    horaInicio: z.string().min(1, "Requerido"),
    horaFin: z.string().min(1, "Requerido"),
    ambienteId: z.string().min(1, "Requerido"),
    docenteId: z.string().min(1, "Requerido"),
});

const formSchema = z.object({
    semestre: z.string().min(1, "Requerido"),
    escuela: z.string().min(1, "Requerido"),
    ciclo: z.coerce.number().min(1).max(10),
    periodoId: z.string().min(1, "Requerido"),
    cursoId: z.string().min(1, "Requerido"),
    grupoId: z.string().min(1, "Requerido"),
    asignaciones: z.array(asignacionFilaSchema).min(1),
}).superRefine((data, ctx) => {
    data.asignaciones.forEach((asig, idx) => {
        const isDocenteConflict = data.asignaciones.some((other, oIdx) =>
            idx !== oIdx &&
            other.docenteId === asig.docenteId &&
            other.dia === asig.dia &&
            other.horaInicio === asig.horaInicio
        );
        if (isDocenteConflict) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El docente ya tiene una sesión asignada en este horario.",
                path: [`asignaciones`, idx, `docenteId`],
            });
        }

        const isAmbienteConflict = data.asignaciones.some((other, oIdx) =>
            idx !== oIdx &&
            other.ambienteId === asig.ambienteId &&
            other.dia === asig.dia &&
            other.horaInicio === asig.horaInicio
        );
        if (isAmbienteConflict) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El ambiente ya está ocupado en este horario.",
                path: [`asignaciones`, idx, `ambienteId`],
            });
        }

        const isGrupoConflict = data.asignaciones.some((other, oIdx) =>
            idx !== oIdx &&
            other.dia === asig.dia &&
            other.horaInicio === asig.horaInicio
        );
        if (isGrupoConflict) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El grupo ya tiene otra sesión asignada en este mismo horario.",
                path: [`asignaciones`, idx, `horaInicio`],
            });
        }
    });
});

type FormValues = z.infer<typeof formSchema>;

export default function ReasignacionPage() {
    const router = useRouter();
    const params = useParams();
    const grupoIdParams = params.grupoId as string;

    const [loading, setLoading] = useState(false);
    const [focusedDraftIndex, setFocusedDraftIndex] = useState<number | null>(0);
    const gridRef = useRef<HTMLDivElement>(null);
    const [inicializado, setInicializado] = useState(false);

    const { data: cursos } = trpc.curso.list.useQuery();
    const { data: docentes } = trpc.docente.list.useQuery();
    const { data: ambientesAula } = trpc.ambiente.listByTipo.useQuery({ tipo: TipoAmbiente.AULA });
    const { data: ambientesLab } = trpc.ambiente.listByTipo.useQuery({ tipo: TipoAmbiente.LABORATORIO });

    const updateAsignacion = trpc.asignacion.updateByGrupo.useMutation();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            semestre: "",
            escuela: "",
            ciclo: 1,
            periodoId: "",
            cursoId: "",
            grupoId: grupoIdParams || "",
            asignaciones: [],
        },
    });

    const { fields, replace, update } = useFieldArray({
        control: form.control,
        name: "asignaciones",
    });

    // 1. Obtener datos originales del grupo para inicializar
    const { data: asignacionesOriginales, isLoading: isLoadingOriginales } = trpc.asignacion.listByGrupoId.useQuery(
        { grupoId: grupoIdParams },
        { enabled: !!grupoIdParams }
    );

    const watchSemestre = form.watch("semestre");
    const watchEscuela = form.watch("escuela");
    const watchCiclo = form.watch("ciclo");
    const watchCursoId = form.watch("cursoId");
    const watchPeriodoId = form.watch("periodoId");
    const watchGrupoId = form.watch("grupoId");
    const watchAsignaciones = form.watch("asignaciones");

    const [filtroGrupoNombre, setFiltroGrupoNombre] = useState("");

    // 2. Inicializar el formulario cuando lleguen los datos originales
    useEffect(() => {
        if (asignacionesOriginales && asignacionesOriginales.length > 0 && !inicializado) {
            const primero = asignacionesOriginales[0];
            const periodo = primero.periodo;
            const curso = primero.grupo.curso;

            form.setValue("semestre", periodo.semestre);
            form.setValue("escuela", periodo.escuela);
            form.setValue("ciclo", curso.ciclo);
            form.setValue("periodoId", periodo.id);
            form.setValue("cursoId", curso.id);
            form.setValue("grupoId", primero.grupo.id);
            setFiltroGrupoNombre(primero.grupo.nombre);

            const filasMap = asignacionesOriginales.map((a: any) => ({
                tipo: a.tipo,
                dia: a.dia,
                horaInicio: a.horaInicio,
                horaFin: a.horaFin,
                ambienteId: a.ambienteId,
                docenteId: a.docenteId,
            }));

            replace(filasMap);
            setInicializado(true);
        } else if (asignacionesOriginales && asignacionesOriginales.length === 0 && !inicializado) {
            toast.error("No se encontraron asignaciones para este grupo.");
            router.push("/dashboard/horarios");
        }
    }, [asignacionesOriginales, form, replace, inicializado, router]);

    // Traer las asignaciones reales de este semestre y escuela para la tabla interactiva
    const { data: asignacionesReales = [], refetch: refetchReales } = trpc.asignacion.listBySemestreEscuela.useQuery(
        { semestre: watchSemestre, escuela: watchEscuela },
        { enabled: !!watchSemestre && !!watchEscuela }
    );

    // OMITIMOS LAS ASIGNACIONES ACTUALES DE ESTE GRUPO de la vista "real" para evitar auto-conflictos
    const asignacionesRealesFiltradas = useMemo(() => {
        return (asignacionesReales ?? []).filter((a: any) => a.grupoId !== grupoIdParams);
    }, [asignacionesReales, grupoIdParams]);

    const selectedCurso = useMemo(() =>
        cursos?.find((c: any) => c.id === watchCursoId),
        [cursos, watchCursoId]
    );

    const ambienteNombreById = useMemo(() => {
        const map = new Map<string, string>();
        (ambientesAula ?? []).forEach((a: any) => {
            if (a?.id && a?.nombre) map.set(a.id, a.nombre);
        });
        (ambientesLab ?? []).forEach((a: any) => {
            if (a?.id && a?.nombre) map.set(a.id, a.nombre);
        });
        return map;
    }, [ambientesAula, ambientesLab]);

    const docenteNombreById = useMemo(() => {
        const map = new Map<string, string>();
        (docentes ?? []).forEach((d: any) => {
            if (d?.id && d?.usuario?.nombre) map.set(d.id, d.usuario.nombre);
        });
        return map;
    }, [docentes]);

    function timeOverlap(inicioA: string, finA: string, inicioB: string, finB: string) {
        if (!inicioA || !finA || !inicioB || !finB) return false;
        return inicioA < finB && finA > inicioB;
    }

    // Calcular conflictos en vivo comparando borradores con las asignaciones reales (filtradas)
    const previewEnVivo = useMemo(() => {
        if (!watchPeriodoId) return [];

        return (watchAsignaciones ?? []).map((a, idx) => {
            const conflictos = (asignacionesRealesFiltradas ?? []).filter((e: any) => {
                if (!e) return false;
                if (e.dia !== a.dia) return false;
                if (!timeOverlap(a.horaInicio, a.horaFin, e.horaInicio, e.horaFin)) return false;

                const conflictDocente = a.docenteId && e.docenteId === a.docenteId;
                const conflictAmbiente = a.ambienteId && e.ambienteId === a.ambienteId;
                // El grupo ya no choca porque lo filtramos, pero si choca con otro grupo distinto:
                const conflictGrupo = e.grupoId === watchGrupoId;

                return conflictDocente || conflictAmbiente || conflictGrupo;
            });

            return {
                index: idx,
                ...a,
                conflictos,
            };
        });
    }, [watchAsignaciones, asignacionesRealesFiltradas, watchPeriodoId, watchGrupoId]);

    const tieneConflictosEnVivo = useMemo(() => {
        return previewEnVivo.some((p: any) => (p.conflictos?.length ?? 0) > 0);
    }, [previewEnVivo]);

    // Guardar horarios editados
    const onSubmit = async (values: FormValues) => {
        if (tieneConflictosEnVivo) {
            toast.error("Hay cruces de horario. Por favor corrígelos antes de guardar.");
            return;
        }

        setLoading(true);
        try {
            await updateAsignacion.mutateAsync({
                periodoId: values.periodoId,
                grupoId: values.grupoId,
                asignaciones: values.asignaciones,
            });
            toast.success("Horario editado y registrado correctamente");
            router.push("/dashboard/horarios");
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar el horario");
        } finally {
            setLoading(false);
        }
    };

    // Funciones para la cuadrícula
    const checkIsSlotFree = (dia: string, hora: string) => {
        if (focusedDraftIndex === null || focusedDraftIndex >= (watchAsignaciones?.length || 0)) return false;

        const activeDraft = watchAsignaciones[focusedDraftIndex];
        const hasDocenteOrAula = activeDraft?.docenteId || activeDraft?.ambienteId;
        if (!hasDocenteOrAula) return false;

        const currentH = parseInt(hora.split(":")[0]);

        const isBlocked = asignacionesRealesFiltradas.some((a: any) => {
            if (a.dia !== dia) return false;
            const tInicio = parseInt(a.horaInicio.split(":")[0]);
            const tFin = parseInt(a.horaFin.split(":")[0]);
            const isTimeMatch = currentH >= tInicio && currentH < tFin;
            if (!isTimeMatch) return false;

            const conflictGrupo = form.getValues("grupoId") === a.grupoId;
            const conflictDocente = activeDraft.docenteId && activeDraft.docenteId === a.docenteId;
            const conflictAmbiente = activeDraft.ambienteId && activeDraft.ambienteId === a.ambienteId;

            return conflictGrupo || conflictDocente || conflictAmbiente;
        });

        return !isBlocked;
    };

    const getCellAsignacionesCombinadas = (dia: string, hora: string) => {
        const currentH = parseInt(hora.split(":")[0]);
        
        // 1. Asignaciones Reales (excluyendo la nuestra original para evitar falso conflicto consigo misma)
        const reales = asignacionesRealesFiltradas.filter((a: any) => {
            if (a.dia !== dia) return false;
            const tInicio = parseInt(a.horaInicio.split(":")[0]);
            const tFin = parseInt(a.horaFin.split(":")[0]);
            const isTimeMatch = currentH >= tInicio && currentH < tFin;
            if (!isTimeMatch) return false;

            const isConflict = previewEnVivo.some((p: any) => 
                p.dia === a.dia && timeOverlap(p.horaInicio, p.horaFin, a.horaInicio, a.horaFin) &&
                (p.docenteId === a.docenteId || p.ambienteId === a.ambienteId)
            );

            // Mostrar si hay un conflicto
            return isConflict;
        }).map((a: any) => ({
            id: a.id,
            isDraft: false,
            dia: a.dia,
            horaInicio: a.horaInicio,
            horaFin: a.horaFin,
            cursoNombre: a.grupo.curso.nombre,
            ciclo: a.grupo.curso.ciclo,
            grupoNombre: a.grupo.nombre,
            ambienteNombre: a.ambiente?.nombre || "",
            docenteNombre: a.docente?.usuario?.nombre || "",
            colorClass: COLORS[a.grupo.curso.id.charCodeAt(0) % COLORS.length],
            isConflictTarget: true
        }));

        // 2. Asignaciones en Borrador
        const borradores = previewEnVivo.filter((a: any) => {
            if (a.dia !== dia) return false;
            if (!a.horaInicio || !a.horaFin) return false;
            const tInicio = parseInt(a.horaInicio.split(":")[0]);
            const tFin = parseInt(a.horaFin.split(":")[0]);
            return currentH >= tInicio && currentH < tFin;
        }).map((a: any) => ({
            id: `draft-${a.index}`,
            isDraft: true,
            dia: a.dia,
            horaInicio: a.horaInicio,
            horaFin: a.horaFin,
            cursoNombre: selectedCurso?.nombre || "Edición de Horario",
            ciclo: watchCiclo,
            grupoNombre: filtroGrupoNombre || "?",
            ambienteNombre: ambienteNombreById.get(a.ambienteId) || "Sin ambiente",
            docenteNombre: docenteNombreById.get(a.docenteId) || "Sin docente",
            colorClass: "bg-white text-slate-800 border-slate-400 border-dashed border-2",
            hasConflict: (a.conflictos?.length ?? 0) > 0
        }));

        return [...reales, ...borradores];
    };

    if (isLoadingOriginales || !inicializado) {
        return (
            <div className="container mx-auto py-20 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 text-lg">Cargando horario para edición...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 max-w-[1600px] px-4 lg:px-8">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/horarios">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Reasignación de Horario</h1>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <div className="xl:col-span-4 space-y-6">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* SECCIÓN A: INFORMACIÓN (Solo lectura en edición) */}
                        <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                            <h2 className="text-lg font-semibold border-bottom pb-2 text-slate-600">Información de la Clase</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-80">
                                <div className="space-y-2">
                                    <Label>Semestre</Label>
                                    <Select disabled value={watchSemestre}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value={watchSemestre}>{watchSemestre}</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Escuela</Label>
                                    <Select disabled value={watchEscuela}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value={watchEscuela}>{watchEscuela}</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciclo</Label>
                                    <Select disabled value={watchCiclo.toString()}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value={watchCiclo.toString()}>{watchCiclo}</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Grupo</Label>
                                    <Select disabled value={filtroGrupoNombre}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value={filtroGrupoNombre}>{filtroGrupoNombre}</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Curso</Label>
                                    <Select disabled value={watchCursoId}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value={watchCursoId}>{selectedCurso?.nombre}</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN C: FILAS DE ASIGNACIÓN */}
                        {fields.length > 0 && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                                <h2 className="text-lg font-semibold border-bottom pb-2 flex items-center justify-between">
                                    <span>Modificar Asignaciones</span>
                                </h2>
                                {tieneConflictosEnVivo && (
                                    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                                        <AlertCircle className="h-5 w-5 mt-0.5" />
                                        <div>
                                            Hay cruces de horario. Por favor revisa la tabla y corrige los conflictos marcados en rojo.
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    {fields.map((field, index) => {
                                        const draftConflictos = previewEnVivo[index]?.conflictos || [];
                                        const isConflict = draftConflictos.length > 0;
                                        const isFocused = focusedDraftIndex === index;
                                        
                                        return (
                                            <div 
                                                key={field.id} 
                                                onClick={() => setFocusedDraftIndex(index)}
                                                className={cn(
                                                    "p-4 rounded-lg border space-y-3 transition-all cursor-pointer", 
                                                    isFocused ? "ring-2 ring-blue-500 shadow-md bg-blue-50/40" : "bg-slate-50 opacity-80 hover:opacity-100",
                                                    isConflict ? (isFocused ? "border-red-400 bg-red-50/50 ring-red-500" : "border-red-400 bg-red-50/50") : (isFocused ? "border-blue-300" : "border-slate-200")
                                                )}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant={field.tipo === TipoAmbiente.AULA ? "default" : "secondary"}>
                                                        {field.tipo === TipoAmbiente.AULA ? "Teoría" : "Laboratorio"}
                                                    </Badge>
                                                    {isConflict && <span className="text-xs text-red-600 font-semibold flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Cruce detectado</span>}
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Día</Label>
                                                        <Select
                                                            value={form.watch(`asignaciones.${index}.dia`)}
                                                            onValueChange={(v) => {
                                                                const currentValues = form.getValues(`asignaciones.${index}`);
                                                                form.setValue(`asignaciones.${index}.dia`, v as DiaSemana);
                                                                update(index, { ...currentValues, dia: v as DiaSemana });
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {Object.values(DiaSemana).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Inicio</Label>
                                                        <Select
                                                            value={form.watch(`asignaciones.${index}.horaInicio`)}
                                                            onValueChange={(v) => {
                                                                const currentValues = form.getValues(`asignaciones.${index}`);
                                                                form.setValue(`asignaciones.${index}.horaInicio`, v);
                                                                const [h] = v.split(":").map(Number);
                                                                const horas = field.tipo === TipoAmbiente.AULA ? selectedCurso?.horasTeoria || 1 : selectedCurso?.horasLab || 1;
                                                                const horaFin = `${String(h + horas).padStart(2, "0")}:00`;
                                                                form.setValue(`asignaciones.${index}.horaFin`, horaFin);
                                                                update(index, { ...currentValues, horaInicio: v, horaFin });
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {HORAS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1 col-span-2">
                                                        <Label className="text-xs">Ambiente</Label>
                                                        <AmbienteCombobox
                                                            tipo={field.tipo}
                                                            value={form.watch(`asignaciones.${index}.ambienteId`)}
                                                            onChange={(v) => {
                                                                const currentValues = form.getValues(`asignaciones.${index}`);
                                                                form.setValue(`asignaciones.${index}.ambienteId`, v);
                                                                update(index, { ...currentValues, ambienteId: v });
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="space-y-1 col-span-2">
                                                        <Label className="text-xs">Docente</Label>
                                                        <Combobox
                                                            options={docentes?.map((d: any) => ({ label: `${d.usuario.nombre} (${d.categoria})`, value: d.id })) || []}
                                                            value={form.watch(`asignaciones.${index}.docenteId`)}
                                                            onChange={(v) => {
                                                                const currentValues = form.getValues(`asignaciones.${index}`);
                                                                form.setValue(`asignaciones.${index}.docenteId`, v);
                                                                update(index, { ...currentValues, docenteId: v });
                                                            }}
                                                            placeholder="Buscar docente..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Link href="/dashboard/horarios" className="w-1/3">
                                        <Button variant="outline" type="button" className="w-full" size="lg">
                                            Cancelar
                                        </Button>
                                    </Link>
                                    <Button type="submit" className="w-2/3" size="lg" disabled={loading || tieneConflictosEnVivo}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* COLUMNA DERECHA: TABLA DINÁMICA */}
                <div className="xl:col-span-8 bg-white rounded-xl shadow-sm border overflow-x-auto relative" ref={gridRef}>
                    <div className="sticky top-0 bg-slate-50 border-b px-4 py-3 z-20 flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                Reasignación de Ciclo {watchCiclo}
                            </h3>
                            <p className="text-xs text-slate-500">
                                Los bloques punteados son los bloques a editar. Haz clic en la tabla o en el formulario para moverlos y detectar cruces.
                            </p>
                        </div>
                    </div>
                    <div className="min-w-[700px] p-2 bg-white">
                        {/* Cabecera de Días */}
                        <div className="grid grid-cols-7 border-b bg-slate-50/80 sticky top-[60px] z-10">
                            <div className="p-3 border-r font-semibold text-slate-500 text-center text-xs flex items-center justify-center">
                                <Clock className="h-3 w-3 mr-1" /> Hora
                            </div>
                            {DIAS.map((dia) => (
                                <div key={dia} className="p-3 border-r last:border-r-0 font-bold text-center text-slate-700 text-sm">
                                    {dia}
                                </div>
                            ))}
                        </div>

                        {/* Cuadrícula de Horas x Días */}
                        <div className="relative">
                            {HORAS.map((hora) => (
                                <div key={hora} className="grid grid-cols-7 border-b last:border-b-0 min-h-[110px]">
                                    {/* Columna de Hora */}
                                    <div className="p-2 border-r bg-slate-50/30 text-xs font-medium text-slate-500 flex items-start justify-center">
                                        {hora}
                                    </div>

                                    {/* Celdas de Días */}
                                    {DIAS.map((dia) => {
                                        const asigs = getCellAsignacionesCombinadas(dia, hora);
                                        const isFree = checkIsSlotFree(dia, hora);
                                        return (
                                            <div key={`${dia}-${hora}`} className={cn("border-r last:border-r-0 p-1 relative group transition-colors", isFree ? "bg-green-100/70 hover:bg-green-200/80" : "bg-white hover:bg-slate-50")}>
                                                {asigs.map((asig: any) => {
                                                    const isStart = asig.horaInicio === hora;
                                                    const duracion = parseInt(asig.horaFin.split(":")[0]) - parseInt(asig.horaInicio.split(":")[0]);
                                                    
                                                    if (!isStart) return null;

                                                    return (
                                                        <div
                                                            key={asig.id}
                                                            className={cn(
                                                                "absolute top-1 left-1 right-1 rounded-md border shadow-sm z-10 flex flex-col overflow-hidden p-1.5",
                                                                asig.colorClass,
                                                                asig.hasConflict && asig.isDraft ? "border-red-500 bg-red-100 text-red-900 shadow-[0_0_10px_rgba(239,68,68,0.5)] z-20" : "",
                                                                asig.isConflictTarget && !asig.isDraft ? "border-red-500 opacity-80" : ""
                                                            )}
                                                            style={{ 
                                                                height: `calc(${duracion * 100}% - 8px)`,
                                                                minHeight: "90px"
                                                            }}
                                                        >
                                                            <div className="flex-1 flex flex-col min-h-0">
                                                                <div 
                                                                    className="font-bold leading-tight text-[11px] mb-1 line-clamp-2"
                                                                    title={asig.cursoNombre}
                                                                >
                                                                    {asig.cursoNombre} {asig.isDraft && "(Editando)"}
                                                                </div>
                                                                <div className="bg-white/60 font-bold text-slate-800 inline-block border border-black/10 self-start text-[9px] px-1 py-0 mb-1 rounded-sm">
                                                                    C{asig.ciclo}-G{asig.grupoNombre}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="border-t border-black/10 shrink-0 pt-1 mt-0.5">
                                                                <span className="flex items-center opacity-90 font-medium leading-tight text-[10px] mb-0.5 gap-1">
                                                                    <MapPin className="flex-shrink-0 h-3 w-3" /> <span className="truncate">{asig.ambienteNombre}</span>
                                                                </span>
                                                                <span className="flex items-center opacity-90 leading-tight text-[10px] gap-1">
                                                                    <User className="flex-shrink-0 h-3 w-3" /> <span className="truncate">{asig.docenteNombre?.split(" ")[0]} {asig.docenteNombre?.split(" ")[1]}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Componentes auxiliares
function Combobox({ options, value, onChange, placeholder }: { options: { label: string, value: string }[], value: string, onChange: (v: string) => void, placeholder: string }) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between overflow-hidden h-9 text-sm px-3">
                    <span className="truncate">{value ? options.find(o => o.value === value)?.label : placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder={placeholder} />
                    <CommandEmpty>No se encontró nada.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                        {options.map((o) => (
                            <CommandItem
                                key={o.value}
                                onSelect={() => {
                                    onChange(o.value);
                                    setOpen(false);
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", value === o.value ? "opacity-100" : "opacity-0")} />
                                {o.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function AmbienteCombobox({ tipo, value, onChange }: { tipo: TipoAmbiente, value: string, onChange: (v: string) => void }) {
    const { data: ambientes } = trpc.ambiente.listByTipo.useQuery({ tipo });
    return (
        <Combobox
            options={ambientes?.map((a: any) => ({ label: `${a.nombre} (Cap: ${a.capacidad})`, value: a.id })) || []}
            value={value}
            onChange={onChange}
            placeholder="Buscar ambiente..."
        />
    );
}
